# Reglas de negocio

## Convención
`BR-[MÓDULO]-[NNN]` — códigos de módulo en [`docs/README.md`](../README.md#códigos-de-módulo).

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2278659, 5b4f99b |

---

# BR-AUT-001 · El token de acceso se genera con entropía criptográfica

## Descripción
El enlace de acceso se apoya en un token aleatorio, no en un valor derivado del usuario.

## Aplica a
- RF-AUT-001

## Condición
Siempre que se solicite un enlace de acceso.

## Regla
El token es `randomBytes(32).toString('hex')`: 32 bytes de entropía, 64 caracteres hexadecimales.

## Resultado si no se cumple
Un token predecible permitiría a un tercero autenticarse como cualquier usuario.

## Mensaje esperado
N/A (no aplica).

## Excepciones
Ninguna.

## Relacionado con
- RF-AUT-001
- FEATURE-002

---

# BR-AUT-002 · Solo se almacena el hash del token

## Descripción
El sistema nunca persiste el token en claro.

## Aplica a
- RF-AUT-001, RF-AUT-002

## Condición
Al crear y al verificar el enlace.

## Regla
En base de datos se guarda `token_hash = sha256(token)` (64 hex). La verificación recalcula el
hash del token recibido y busca por ese valor.

## Resultado si no se cumple
Una filtración de `magic_links` permitiría autenticar a cualquier usuario que aun conserve el correo.

## Mensaje esperado
N/A (no aplica).

## Excepciones
Ninguna.

## Relacionado con
- RF-AUT-001, RF-AUT-002
- SEC-002 (ver [`06-security/security-requirements.md`](../06-security/security-requirements.md))
- FEATURE-002

---

# BR-AUT-003 · El enlace expira a los 30 minutos

## Descripción
Un enlace de acceso tiene vigencia limitada.

## Aplica a
- RF-AUT-001, RF-AUT-002

## Condición
Al verificar el enlace.

## Regla
`expires_at = ahora + 30 minutos`. Si `expires_at - ahora <= 0`, la verificación falla.

## Resultado si no se cumple
Un correo interceptado podría convertirse en un acceso permanente.

## Mensaje esperado
`El enlace es inválido o ya expiró. Solicita uno nuevo.`

## Excepciones
Ninguna.

## Relacionado con
- RF-AUT-001, RF-AUT-002
- FEATURE-002

---

# BR-AUT-004 · La respuesta es genérica: no se revela si el correo existe

## Descripción
El pedido de enlace no debe funcionar como un oráculo de cuentas registradas.

## Aplica a
- RF-AUT-001

## Condición
Siempre.

## Regla
Con o sin usuario, el usuario final recibe el mismo mensaje y el mismo redirect:
`Si tu correo está registrado, recibirás un enlace de acceso.`

## Resultado si no se cumple
Permite enumerar correos registrados en el sistema.

## Mensaje esperado
`Si tu correo está registrado, recibirás un enlace de acceso.`

## Excepciones
Ninguna en el mensaje. **Existe una fuga por tiempo**: la rama con usuario registrado además
crea la fila y llama al SMTP, por lo que tarda más que la rama sin usuario.

## Relacionado con
- RF-AUT-001
- SEC-006
- FEATURE-002

---

# BR-AUT-005 · Un enlace es de un solo uso

## Descripción
Un mismo enlace no puede abrir dos sesiones.

## Aplica a
- RF-AUT-002

## Condición
Al verificar el enlace.

## Regla
La búsqueda exige `used_at IS NULL` y, tras validar, se escribe `used_at` **antes** de autenticar.

## Resultado si no se cumple
El enlace podría reutilizarse mientras siga vigente (p. ej. desde el historial del correo).

## Mensaje esperado
`El enlace es inválido o ya expiró. Solicita uno nuevo.`

## Excepciones
La comprobación y la escritura no son atómicas: dos peticiones simultáneas con el mismo token
pueden superar ambas el filtro `used_at IS NULL`.

## Relacionado con
- RF-AUT-002
- FEATURE-002

---

# BR-AUT-006 · Cerrar sesión exige un POST con token CSRF válido

## Descripción
La Invalidación de sesión es una operación de escritura protegida.

## Aplica a
- RF-AUT-003

## Condición
Siempre.

## Regla
`POST /logout` está en el grupo con `middleware.auth()` y el método es procesado por el guard
CSRF de Shield. Sin token válido la operación se rechaza y **la sesión sobrevive**.

## Resultado si no se cumple
Un sitio externo podría cerrar la sesión del usuario o ejecutar acciones de escritura en su nombre.

## Mensaje esperado
Flash de error de Shield (`Invalid or expired CSRF token`) y redirect a la página anterior.

## Excepciones
Ninguna.

## Relacionado con
- RF-AUT-003
- SEC-003
- FEATURE-002

---

# BR-INS-001 · Paginación fija de 10, orden estable por ID

## Descripción
El listado del catálogo se recorre en bloques de tamaño fijo y orden determinista.

## Aplica a
- RF-INS-001, RF-INS-002

## Condición
Siempre que se consulte el catálogo.

## Regla
`perPage = 10` (constante en el controller) y `ORDER BY ID ASC`.

## Resultado si no se cumple
Paginación inconsistente entre visitas o registros que aparecen duplicados o desaparecen entre páginas.

## Mensaje esperado
N/A (no aplica).

## Excepciones
Ninguna.

## Relacionado con
- RF-INS-001, RF-INS-002
- FEATURE-001

---

# BR-INS-002 · Búsqueda por subcadena, insensible a mayúsculas y escapada

## Descripción
Los buscadores del catálogo buscan "contiene" y no interpretan comodines.

## Aplica a
- RF-INS-003, RF-INS-004

## Condición
Cuando `nombre` o `codigo` traen valor.

## Regla
`WHERE <columna> ILIKE '%término%'`, y el término se escapa sustituyendo `%` → `\%` y `_` → `\_`
antes de interpolarlo.

## Resultado si no se cumple
Un usuario que escriba `%` obtendrá el catálogo completo, y las búsquedas con `_` devolverán
resultados que no corresponden.

## Mensaje esperado
N/A (no aplica).

## Excepciones
Ninguna.

## Relacionado con
- RF-INS-003, RF-INS-004
- FEATURE-001

---

# BR-INS-003 · El catálogo es de solo lectura

## Descripción
La aplicación nunca escribe en el catálogo de Supabase.

## Aplica a
- RF-INS-001, RF-INS-005

## Condición
Siempre.

## Regla
La conexión `supabase` declara `migrations.paths: []` y solo se usan consultas `SELECT`. No existe
ninguna ruta ni método que cree, actualice o borre insumos.

## Resultado si no se cumple
Escrituras accidentales sobre el catálogo compartido, sin control de versiones ni reversión.

## Mensaje esperado
N/A (no aplica).

## Excepciones
Ninguna.

## Relacionado con
- RF-INS-001, RF-INS-005
- FEATURE-001

---

# BR-INS-004 · El catálogo se resuelve primero en el schema `dev`

## Descripción
Existe una tabla homónima en `public`, pero la fuente de verdad es `dev`.

## Aplica a
- RF-INS-001

## Condición
Al abrir cada conexión a Supabase.

## Regla
La conexión declara `searchPath: ['dev', 'public']`, que knex traduce a
`set search_path to 'dev','public'`. El modelo no declara `static schema`.

## Resultado si no se cumple
Consultas podrían resolverse contra la copia de `public` si el orden del search path cambia, y
servirían datos que no son la fuente de verdad.

## Mensaje esperado
N/A (no aplica).

## Excepciones
Si una tabla futura solo existiera en `public`, se leería igual por el fallback. Para evitarlo,
hay que quitar el fallback o declarar `static schema` en el modelo.

## Relacionado con
- RF-INS-001
- ADR-003, ADR-004
- FEATURE-001

---

# BR-INS-005 · El buscador "ID" filtra por código, no por identificador

## Descripción
La etiqueta de UI y la columna consultada no coinciden.

## Aplica a
- RF-INS-004

## Condición
Cuando se usa el buscador rotulado "ID".

## Regla
El campo "Buscar ID" consulta `DEFAULT_CODE`. La columna `ID` no es buscable desde la UI.

## Resultado si no se cumple
El usuario que busca por el identificador numérico interno no obtiene lo que espera.

## Mensaje esperado
N/A (no aplica).

## Excepciones
Ninguna. Se conserva así por fidelidad con el diseño original.

## Relacionado con
- RF-INS-004
- FEATURE-001

---

# BR-INS-006 · Toda consulta al catálogo tolera un corte de conexión

## Descripción
Supabase cierra las conexiones inactivas, por lo que la primera consulta posterior puede fallar.

## Aplica a
- RF-INS-001, RF-INS-002, RF-INS-003, RF-INS-004

## Condición
Cuando la conexión en reposo fue cerrada por el servidor.

## Regla
La consulta se ejecuta dentro de `withConnectionRetry()`, que reintenta **una vez** ante un error
de conexión. La conexión además declara `keepAlive` con `keepAliveInitialDelayMillis` de 30 s y
un pool con `idleTimeoutMillis` de 30 s.

## Resultado si no se cumple
El usuario ve "connection terminated unexpectedly" tras varios minutos sin uso.

## Mensaje esperado
N/A (no aplica: el error se absorbe con el reintento).

## Excepciones
Si el primer y el segundo intento fallan, el error sube al handler y se renderiza la página de error.

## Relacionado con
- RF-INS-001
- FEATURE-001

---

## Brechas

- `BR-AUT-005` tiene una ventana de carrera (TOCTOU) entre comprobar y marcar el token como usado.
- `BR-AUT-004` se cumple en el mensaje, pero se incumple implícitamente en el tiempo de respuesta.
- No existe regla para el número máximo de enlaces vivos por usuario ni para su depuración.
- No hay reglas de negocio definidas para las pantallas mock (SKU, familias, usuarios, módulos
  de salud): se redactarán junto con sus features.

## BR-KIT · Kits de insumos

Definidas en
[FEATURE-005](../features/FEATURE-005-kits-de-insumos.md). Resumen:

- BR-KIT-001: los kits se leen de `dev."Kits"` en Supabase, solo lectura.
- BR-KIT-002: la columna `"Insumos"` es una lista de códigos separados por coma; la columna
  "Insumos" de la tabla muestra **cuántos** hay, no la lista.
- BR-KIT-003: `Costo` se muestra con 2 decimales; si es nulo se muestra `—`, nunca `$0.00`.
- BR-KIT-004: el `ID_odoo` se muestra con prefijo `#`.
- BR-KIT-005: paginación de 10, orden ascendente por `id`.
- BR-KIT-006: los buscadores usan `ILIKE` con `%` y `_` escapados.
- BR-KIT-007: los filtros se conservan al cambiar de página.

## BR-ZON · Zonas

Definidas en
[FEATURE-007](../features/FEATURE-007-catalogo-zonas.md). Resumen:

- BR-ZON-001: las zonas se leen de `dev."zonas"` en Supabase, solo lectura. Tabla y columnas en
  minúsculas (`id`, `nombre`, `descripcion`, `costo`, `created_at`, `updated_at`).
- BR-ZON-002: la columna "Clínicas" no está en `dev."zonas"`: se calcula contando las filas de
  `public.clinicas_zonas` con el mismo `zona_id`, con una subconsulta correlacionada (no un join,
  que rompería el conteo del paginador).
- BR-ZON-003: paginación de 10, orden ascendente por `id`.
- BR-ZON-004: el buscador único filtra por `nombre` con `ILIKE` y `%`/`_` escapados.
- BR-ZON-005: `costo` no se muestra en la pantalla ni se expone en el modelo; existe en la tabla
  pero es `NULL` en las 2 filas actuales. El `id` va bajo el nombre sin prefijo `#`.

## BR-MSD · Módulos de salud

Definidas en
[FEATURE-008](../features/FEATURE-008-modulos-de-salud.md). Resumen:

- BR-MSD-001: los módulos de salud se leen de `dev.modulos_salud` en Supabase, solo lectura. Tabla
  y columnas en minúsculas (`id`, `nombre`, `descripcion`, `created_at`, `updated_at`,
  `id_modulo`).
- BR-MSD-002: la columna "SKU" **muestra 0 como dato dummy** en todas las filas. No es derivable:
  `public."SKU"` no tiene ninguna columna ni FK que referencie un módulo, así que no hay forma de
  contar los SKUs por módulo. El valor vive en una constante del frontend, declarada como tal.
- BR-MSD-003: paginación de 10, orden ascendente por `id`.
- BR-MSD-004: el buscador único filtra por `nombre` con `ILIKE` y `%`/`_` escapados.
- BR-MSD-005: la tabla tiene 3 columnas (`Nombre`, `SKU`, `Opciones`) como la referencia de diseño;
  el botón trash va bajo "Opciones". `id_modulo` y `updated_at` no se muestran ni se declaran en el
  modelo.
