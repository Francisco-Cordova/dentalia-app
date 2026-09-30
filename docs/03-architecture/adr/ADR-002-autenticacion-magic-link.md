# ADR-002 · Autenticación por enlace mágico, sin contraseña

- Estado: Accepted
- Fecha: 2026-09-30 (refleja la decisión tomada en el commit `9d07876`)
- Decisores: Dev owner

## Contexto
El panel es de uso interno y su audience es pequeño (personal de la clínica). No hay usuarios
registrados previamente, ni recuperación de contraseña, ni verificación de correo de dominio.
El flujo conocido (`Plantillas/users/`) es: el usuario escribe su correo y el sistema le envía un
enlace; al abrirlo queda con sesión iniciada.

## Opciones consideradas

### Opción A · Magic link (enlace de un solo uso por correo)
- Ventajas:
  - Sin contraseñas: nada que guardar, filtrar ni reutilizar.
  - El correo es la prueba de posesión: quien recibe el enlace tiene la cuenta.
  - Encaja con el diseño original (`Plantillas/users/`), sin trabajo de diseño extra.
  - El token se genera con `crypto.randomBytes(32).toString('hex')` (64 hex, entropía
    criptográfica) y se persiste **hasheado** con SHA-256, no en claro.
  - No depende de que el usuario recuerde una contraseña ni exige storing de hashes de contraseña
    en el camino crítico (aunque `users.password` existe por el autoregistro de `/signup`).
- Desventajas:
  - Depende del SMTP: si el correo no llega, no hay entrada.
  - Requiere proteger el endpoint de envío contra abuso (ver Brechas).
  - Un token robado antes de expirar permite el acceso (ventana de 30 minutos).

### Opción B · Contraseña
- Ventajas: no depende del correo para entrar; familiaridad del usuario.
- Desventajas:
  - Obliga a alta, confirmación y recuperación de contraseña: considerable trabajo.
  - Almacenar y proteger contraseñas exige hash, política de complejidad y rotación.

### Opción C · SSO corporativo
- Ventajas: control centralizado, sin vida de contraseñas en el panel.
- Desventajas: requiere Proveedor de Identidad, configuración de redirect URIs y probablemente un
  proveedor de correo distinto; excede el alcance actual.

## Decisión
**Opción A**: magic link como **único mecanismo de acceso al panel**. `users` se puebla por el
seeder o por el autoregistro de `/signup`, no por el propio enlace. El token se consume una sola
vez (`used_at`) y expira a los 30 minutos (`TOKEN_TTL_MINUTES = 30`,
`app/controllers/magic_link_controller.ts:13`).

Verificado por HTTP: token reutilizado → 302 al login con flash de error; `used_at` queda escrito;
`/insumos` sin sesión → 302 a `/`.

## Consecuencias

### Positivas
- `magic_links` es la única tabla de credenciales y cuelga de `users` por FK
  (`(id, user_id, token_hash, expires_at, used_at, created_at, updated_at)`,
  `user_id → users.id ON DELETE CASCADE`).
- **El token nunca se guarda en claro**: se hashea con SHA-256 (`token_hash`, 64 hex) y el valor
  crudo solo viaja en el correo. Una fuga de la tabla no permite autenticar.
- Consumo de un solo uso garantizado por `used_at IS NULL` + `UNIQUE(token_hash)`.
- Consistencia con el diseño original.
- Superficie de autenticación pequeña.

### Negativas / trade-offs
- **El magic link no da de alta usuarios**: `magic_link_controller.ts:18` exige un `User` previo
  (`User.findBy('email', email)`); si no existe, no se crea fila ni se envía correo y la respuesta es
  la misma (verificado por HTTP). Quien crea las cuentas es el seeder
  (`database/seeders/add_magic_link_test_user_seeder.ts`) o el autoregistro de `/signup`.
- **La Alta de usuarios queda fuera de este flujo**: la única vía es `POST /signup`, que no está
  enlazada desde la pantalla de login y autentica de inmediato sin verificar el correo.
- Dependencia dura del canal de correo: sin SMTP no hay entrada.

## Revisión
Reevaluar si la clínica exige SSO corporativo, si aparecen usuarios reales que necesitan
recuperación, o si el volumen de usuarios justifica un proveedor de identidad.
