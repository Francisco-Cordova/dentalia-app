# Requerimientos funcionales

## Convención
`RF-[MÓDULO]-[NNN]` — códigos de módulo en [`docs/README.md`](../README.md#códigos-de-módulo).

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2278659, 5b4f99b |

Este documento cubre **solo lo que el código implementa hoy**: autenticación por magic link
(`AUT`) y catálogo de insumos (`INS`). Las demás pantallas del clon son maquetas sin datos
(ver `docs/features/`).

---

# RF-AUT-001 · Solicitar enlace de acceso

## Objetivo
Permitir que una persona con cuenta registrada ingrese al panel sin contraseña, mediante un
enlace de un solo uso enviado a su correo.

## Actor
Administrador (usuario registrado).

## Precondiciones
- El correo existe en `users`.
- `SESSION_DRIVER` resuelto desde `.env` (solo `cookie` está operativo: no existe tabla `sessions`).

## Entradas
- `email` (string, 1–254, formato correo) — validado por `magicLinkValidator` (`app/validators/user.ts:36-38`).

## Flujo principal
1. `POST /login/magic` con el correo.
2. Se genera un token aleatorio de 32 bytes (`app/controllers/magic_link_controller.ts:22`).
3. Se persiste **solo el hash sha256** del token y su expiración a 30 min (`:26-27`).
4. Se envía el correo con el enlace `{APP_URL}/auth/magic/{token}` (`:31-34`).
5. Se responde con un mensaje genérico y redirect a la página anterior (`:45-46`).

## Reglas relacionadas
- BR-AUT-001, BR-AUT-002, BR-AUT-004

## Resultado esperado
Flash de éxito genérico y una fila nueva en `magic_links`. La UI no revela si el correo existe.

## Permisos
- Público: puede solicitar el enlace (no requiere sesión).

## Criterios de aceptación
- [x] El mensaje de respuesta es idéntico exista o no el correo.
- [x] El token en claro nunca se persiste, solo su sha256.
- [x] El enlace enviado expira a los 30 minutos.
- [x] Si el envío falla en dev, la URL se registra en el log como `[MAGIC LINK DEV]`.

## Excepciones / casos límite
- Correo inexistente: no se crea fila ni se envía correo; la respuesta es la misma.
- Fallo de SMTP: en dev se registra y se continua; en producción se relanza el error (500).
- Tokens previos del mismo usuario **no** se invalidan: pueden coexistir varios válidos.

## Referencias
- Feature: FEATURE-002
- API: `POST /login/magic`
- Diseño: [FLOW-AUT-001](../02-functional-design/flows/FLOW-AUT-001.md)

---

# RF-AUT-002 · Verificar enlace e iniciar sesión

## Objetivo
Convertir un enlace válido en una sesión autenticada y admitir el acceso al panel.

## Actor
Administrador (dueño del token).

## Precondiciones
- Existe una fila en `magic_links` con el `token_hash` correspondiente, `used_at IS NULL` y `expires_at` en el futuro.

## Entradas
- `token` (path param, 64 caracteres hex).

## Flujo principal
1. `GET /auth/magic/:token`.
2. Se calcula el sha256 y se busca la fila con `used_at IS NULL`, precargando el usuario (`:53-57`).
3. Se marca `used_at` antes de autenticar (`:64-65`).
4. `auth.use('web').login(user)`, que regenera el identificador de sesión.
5. Redirect a `/skus`.

## Reglas relacionadas
- BR-AUT-002, BR-AUT-003, BR-AUT-005

## Resultado esperado
Sesión activa (cookie cifrada, `HttpOnly`, `SameSite=Lax`, 2 h) y acceso a las rutas del panel.

## Permisos
- Público: puede verificar el token (no requiere sesión).

## Criterios de aceptación
- [x] El token se marca usado y no puede reutilizarse.
- [x] El identificador de sesión se regenera al iniciar sesión.
- [x] Un token expirado o inexistente no autentica y redirige al login con flash de error.

## Excepciones / casos límite
- El token viaja en la URL: queda en logs del servidor/proxy y en cabeceras `Referer`.
- La marca de uso y el inicio de sesión no son atómicos: dos peticiones concurrentes con el
  mismo token podrían autenticar dos veces.
- Los datos cifrados de sesión viajan en una cookie propia separada de `adonis-session`.

## Referencias
- Feature: FEATURE-002
- API: `GET /auth/magic/:token`
- Diseño: [FLOW-AUT-001](../02-functional-design/flows/FLOW-AUT-001.md)

---

# RF-AUT-003 · Cerrar sesión

## Objetivo
Finalizar la sesión del usuario y devolverlo al login.

## Actor
Administrador autenticado.

## Precondiciones
- Sesión activa.

## Entradas
- Petición `POST /logout` con token CSRF válido.

## Flujo principal
1. El layout envía el `<Form route="session.destroy">` desde el menú de usuario (`inertia/layouts/admin.tsx:173`).
2. Shield valida el token CSRF (métodos `POST/PUT/PATCH/DELETE`).
3. El controller destruye la sesión y redirige a `/`.

## Reglas relacionadas
- BR-AUT-006

## Resultado esperado
Redirect a `/` y la sesión deja de proteger las rutas del panel.

## Permisos
- Administrador: `sesion:delete`.

## Criterios de aceptación
- [x] Sin token CSRF la petición se rechaza con redirect + flash de error y **la sesión sobrevive**.
- [x] Con token CSRF válido la sesión se destruye y las rutas protegidas vuelven a redirigir a `/`.
- [x] El nombre de ruta `session.destroy` está registrado (codegen coherente con `start/routes.ts`).

## Excepciones / casos límite
- El identificador de sesión no se regenera ni se invalida al cerrar sesión, solo se olvidan
  sus datos.
- Sin sesión activa, la petición responde con el mismo redirect a `/`.

## Referencias
- Feature: FEATURE-002
- API: `POST /logout`
- Diseño: [FLOW-AUT-001](../02-functional-design/flows/FLOW-AUT-001.md)

---

# RF-INS-001 · Listar insumos del catálogo

## Objetivo
Mostrar el catálogo de insumos con su código, marca, cantidad y costo unitario.

## Actor
Administrador autenticado.

## Precondiciones
- Sesión activa.
- `SUPABASE_DB_URL` válido (debe incluir contraseña) y proyecto Supabase accesible.

## Entradas
- Ninguna para el listado inicial (página 1).

## Flujo principal
1. `GET /insumos` llega a `InsumosController.index`.
2. Se ejecuta `SELECT ID, NAME, DEFAULT_CODE, MARCA, CANTIDAD, UNIT_COST FROM "Insumos" ORDER BY ID ASC LIMIT 10 OFFSET 0`, envuelto en `withConnectionRetry()`.
3. El controller renderiza `insumos`, `total`, `page` y `lastPage`.
4. La página pinta la tabla con el costo formateado como moneda.

## Reglas relacionadas
- BR-INS-001, BR-INS-003, BR-INS-004, BR-INS-006

## Resultado esperado
Tabla con 10 insumos, el total real del catálogo y la paginación calculada.

## Permisos
- Administrador: `insumos:read`.

## Criterios de aceptación
- [x] El total devuelto corresponde al catálogo real (~5,060 filas).
- [x] El orden es estable y ascendente por `ID`.
- [x] El costo unitario se formatea como moneda.
- [x] La consulta sobrevive a un corte de conexión y reintenta una vez.

## Excepciones / casos límite
- La columna visible "Categoría" se alimenta de `MARCA` (nombre de la columna heredado).
- La fecha "Última actualización" de la UI es texto fijo, no `modified_at`.

## Referencias
- Feature: FEATURE-001
- API: `GET /insumos`
- Diseño: [FLOW-INS-001](../02-functional-design/flows/FLOW-INS-001.md)

---

# RF-INS-002 · Paginar el listado

## Objetivo
Navegar el catálogo por páginas de 10 registros conservando los filtros activos.

## Actor
Administrador autenticado.

## Precondiciones
- `RF-INS-001` disponible.

## Entradas
- `page` (query, entero ≥ 1; por defecto 1).

## Flujo principal
1. El usuario pulsa un número de página.
2. La página navega a `route('insumos')` con `qs: { page }` y los filtros vigentes.
3. El controller pagina y devuelve `page` y `lastPage`.
4. La UI resalta la página actual y calcula una ventana de 5 páginas.

## Reglas relacionadas
- BR-INS-001

## Resultado esperado
Página solicitada con los filtros aplicados.

## Permisos
- Administrador: `insumos:read`.

## Criterios de aceptación
- [x] Cada página muestra como máximo 10 registros.
- [x] Los filtros se conservan al cambiar de página.
- [x] La ventana de paginación se calcula a partir de `lastPage`.

## Excepciones / casos límite
- `page` fuera de rango devuelve la página vacía correspondiente.
- El total implica **dos** consultas (conteo + página) en cada visita.

## Referencias
- Feature: FEATURE-001
- API: `GET /insumos?page=N`
- Diseño: [FLOW-INS-001](../02-functional-design/flows/FLOW-INS-001.md)

---

# RF-INS-003 · Buscar por nombre

## Objetivo
Localizar insumos cuyo nombre contenga el texto buscado, sin distinguir mayúsculas.

## Actor
Administrador autenticado.

## Precondiciones
- `RF-INS-001` disponible.

## Entradas
- `nombre` (query, texto libre).

## Flujo principal
1. El usuario escribe en "Buscar nombre" y pulsa Enter.
2. La página navega a `route('insumos')` con `qs: { nombre }`.
3. El controller aplica `WHERE NAME ILIKE '%nombre%'`.
4. Se devuelve la página 1 con los filtros aplicados.

## Reglas relacionadas
- BR-INS-002, BR-INS-005

## Resultado esperado
Listado filtrado por nombre, en mayúsculas o minúsculas indistintamente.

## Permisos
- Administrador: `insumos:read`.

## Criterios de aceptación
- [x] `acrilico`, `ACRILICO` y `AcRiLiCo` devuelven el mismo conjunto.
- [x] El filtro se combina con el de código y con la paginación.
- [x] Buscar sin resultados devuelve la tabla vacía sin error.

## Excepciones / casos límite
- El texto se escapa, por lo que `%` y `_` se buscan literalmente.
- La búsqueda no es en vivo: requiere Enter (el formulario no tiene botón submit).

## Referencias
- Feature: FEATURE-001
- API: `GET /insumos?nombre=...`
- Diseño: [FLOW-INS-001](../02-functional-design/flows/FLOW-INS-001.md)

---

# RF-INS-004 · Buscar por código

## Objetivo
Localizar un insumo por su código de catálogo.

## Actor
Administrador autenticado.

## Precondiciones
- `RF-INS-001` disponible.

## Entradas
- `codigo` (query, texto libre).

## Flujo principal
1. El usuario escribe en "Buscar ID" y pulsa Enter.
2. La página navega a `route('insumos')` con `qs: { codigo }`.
3. El controller aplica `WHERE DEFAULT_CODE ILIKE '%codigo%'`.
4. Se devuelve la página 1 con los filtros aplicados.

## Reglas relacionadas
- BR-INS-002, BR-INS-005

## Resultado esperado
Listado filtrado por código.

## Permisos
- Administrador: `insumos:read`.

## Criterios de aceptación
- [x] `o0679` y `O0679` devuelven el mismo registro.
- [x] La búsqueda es parcial (contiene), no exacta.
- [x] Combina con el filtro de nombre y con la paginación.

## Excepciones / casos límite
- El campo se rotula "ID" pero **no** filtra por la columna `ID`.
- Un código vacío no aplica filtro.

## Referencias
- Feature: FEATURE-001
- API: `GET /insumos?codigo=...`
- Diseño: [FLOW-INS-001](../02-functional-design/flows/FLOW-INS-001.md)

---

# RF-INS-005 · Consultar cantidad y costo unitario

## Objetivo
Mostrar, por insumo, la cantidad existente y el costo unitario del catálogo.

## Actor
Administrador autenticado.

## Precondiciones
- `RF-INS-001` disponible.

## Entradas
- Ninguna (columnas del listado).

## Flujo principal
1. El controller selecciona `CANTIDAD` y `UNIT_COST`.
2. El modelo los expone como `cantidad` y `costo`.
3. La página los pinta; el costo con formato de moneda.

## Reglas relacionadas
- BR-INS-003

## Resultado esperado
Cantidad y costo visibles por fila.

## Permisos
- Administrador: `insumos:read`.

## Criterios de aceptación
- [x] Los valores provienen del catálogo, no son constantes en la vista.
- [x] El costo se formatea con separador de miles y decimales.

## Excepciones / casos límite
- Las unidades y présentation viven en el catálogo (`UOM`, `PRESENTACION`) pero la vista no las muestra.

## Referencias
- Feature: FEATURE-001
- API: `GET /insumos`
- Diseño: [FLOW-INS-001](../02-functional-design/flows/FLOW-INS-001.md)

---

## Brechas

- No existe paginación por tamaño configurable: el 10 está fijo en el controller.
- No hay exportación ni detalle por insumo (pantalla de una sola fila).
- La UI muestra "Última actualización" fija pese a existir `modified_at`.
- "Ordenar" y el icono de refrescar no tienen comportamiento.
