# Casos de prueba

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Convenciones

| Elemento | Convención |
|---|---|
| ID | `TC-<feature>-<n>`, p. ej. `TC-AUT-001` |
| Precondición | Estado previo explícito, incluyendo el de la BD |
| Pasos | Acciones de usuario o llamadas HTTP identificables |
| Resultado esperado | Status, redirect, prop o contenido verificable |
| Estado | `Pendiente` / `Ejecutado` / `Fallido` / `Obsoleto` |
| Evidencia | Qué se dejó registrado. Hoy: casi nada (ver brecha al final) |

**Ningún caso de esta tabla está automatizado.** "Ejecutado" significa que alguien lo probó a mano
en DEV y lo anotó aquí; no hay forma de volver a comprobarlo.

## Casos de autenticación (FEATURE-002)

| ID | Precondición | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| TC-AUT-001 | `users` con `admin@dentalia.test` | `POST /login/magic` con ese email | 302 a `/login/magic`, correo enviado, fila nueva en `magic_links` con `used_at` nulo | Ejecutado |
| TC-AUT-002 | `users` vacío para el email | `POST /login/magic` con email no registrado | 302, **sin** correo enviado, **sin** fila en `magic_links` | Ejecutado |
| TC-AUT-003 | `magic_links` con token válido sin usar | `GET /auth/magic/:token` | 302 a `/skus`, cookie de sesión emitida, `used_at` actualizado | Ejecutado |
| TC-AUT-004 | Igual que TC-AUT-003 | Repetir `GET` con el mismo token | 200 en `/` con error: el token es de un solo uso | Ejecutado |
| TC-AUT-005 | `magic_links` con `expires_at` pasado | `GET /auth/magic/:token` | 200 en `/` con error de expirado; `used_at` se marca | Ejecutado |
| TC-AUT-006 | Token de 32 bytes aleatorios | Inspeccionar `magic_links.token_hash` | Es el SHA-256 del token (64 hex), **nunca** el token en claro | Ejecutado |
| TC-AUT-007 | Sin cookie de sesión | `GET /skus` | 302 a `/` (no a un 403) | Ejecutado |
| TC-AUT-008 | Con cookie de sesión | `GET /skus` | 200 renderizando `skus` con `user` y el catálogo real de `dev."SKU"` (255 filas; antes eran 9 productos del array mock) | Ejecutado |
| TC-AUT-009 | Con cookie de sesión, **sin** XSRF | `POST /logout` | La sesión **no** se destruye: responde 302 y sigue activa | Ejecutado |
| TC-AUT-010 | Con cookie de sesión y XSRF válido | `POST /logout` | 302 y sesión destruida; `GET /skus` vuelve a 302 a `/` | Ejecutado |
| TC-AUT-011 | `users` sin fila | `GET /signup` y `POST /signup` con email, password y nombre | Crea el usuario con `password` hasheado por el mixin, inicia sesión, 302 | Ejecutado |
| TC-AUT-012 | `users` con ese email | `POST /signup` de nuevo | Flash de error: email duplicado (índice único en `users.email`) | Pendiente |
| TC-AUT-013 | Formulario de login | Pulsar Enter | **No** dispara envío: `<form>` con 2+ inputs y sin botón submit no hace implicit submission | Ejecutado |
| TC-AUT-014 | `NODE_ENV=development` | `POST /login/magic` con Mailtrap caído | Se loguea `[MAGIC LINK DEV] <url>` con el token en claro | Ejecutado |

## Casos del catálogo (FEATURE-001)

| ID | Precondición | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| TC-INS-001 | Sesión válida, `searchPath = dev` | `GET /insumos` | 200 con `total`, `page: 1`, `lastPage`, `filtros` y 10 insumos ordenados por `ID` asc | Ejecutado |
| TC-INS-002 | Sesión válida | `GET /insumos?nombre=acero` | Filtra por `ilike %acero%` sobre `NAME`, `total` refleja el filtro | Ejecutado |
| TC-INS-003 | Sesión válida | `GET /insumos?codigo=X-100` | Filtra por `DEFAULT_CODE` (**no** por `ID`) | Ejecutado |
| TC-INS-004 | Sesión válida | `GET /insumos?page=999` | Página vacía, sin error; la paginación no revienta | Ejecutado |
| TC-INS-005 | Sesión válida | `GET /insumos?nombre=%25` | Escapa el `%` con `escapeLike()`: busca un literal `%`, no un comodín | Ejecutado |
| TC-INS-006 | Sesión válida | `GET /insumos?nombre=_` | Escapa el `_`: busca un literal, no un comodín de un carácter | Ejecutado |
| TC-INS-007 | Sesión válida, buscador | Escribir un término y pulsar Enter | El `onKeyDown` dispara la búsqueda: el search no depende del submit implícito | Ejecutado |
| TC-INS-008 | Sesión válida | `/insumos` tras 2 min de inactividad | `withConnectionRetry()` reconecta y no hay "connection terminated unexpectedly" | Ejecutado |
| TC-INS-009 | `SUPABASE_DB_URL` sin `:PASSWORD` | Arrancar el servidor | Falla al arrancar con el error de SCRAM | Ejecutado |

## Casos del catálogo de usuarios (FEATURE-006)

| ID | Precondición | Acción | Resultado esperado | Estado |
|---|---|---|---|---|
| TC-USR-001 | Sesión válida, `users` con la fila `id 1` | `GET /usuarios` | 200 con `total: 1`, `page: 1`, `lastPage: 1`, `q: null` y `area: 'TO'`, `rol: 'Superadmin'`, `superadmin: true` | Pendiente |
| TC-USR-002 | Sesión válida | `GET /usuarios` e inspeccionar las props | **No** aparece `password` en ninguna fila: el `select` nombra columnas y omite el hash | Pendiente |
| TC-USR-003 | `users` con varias filas | `GET /usuarios?q=correo` | Filtra por `email`; `total` refleja el filtro | Pendiente |
| TC-USR-004 | `users` con varias filas | `GET /usuarios?q=nombre` | Filtra por `full_name` con el mismo parámetro | Pendiente |
| TC-USR-005 | `users` con una fila que contenga un `%` literal | `GET /usuarios?q=%` | Escapa el `%` con `escapeLike()` **y la cláusula `ESCAPE '\'`**: devuelve esa fila, no el catálogo entero | Pendiente |
| TC-USR-006 | `users` con `full_name` en `NULL` | `GET /usuarios?q=<correo>` | Aparece en el resultado: `email` cubre el alta por magic link, que no pide nombre | Pendiente |
| TC-USR-007 | Sesión válida, buscador | Escribir un término y pulsar Enter | El `onKeyDown` dispara la búsqueda: no depende del submit implícito | Pendiente |
| TC-USR-008 | Sesión válida | `GET /usuarios?page=999` | Página vacía, sin error | Pendiente |
| TC-USR-009 | Sin sesión | `GET /usuarios` | 302 a `/`: se aplica `middleware.auth()` | Pendiente |
| TC-USR-010 | Sesión válida | `POST /usuarios` | 404: `router.get()` solo registra GET; el modal "Nuevo usuario" es maqueta | Pendiente |
| TC-USR-011 | `users.superadmin = false` | `GET /usuarios` | La columna muestra `No`, no una casilla ni un badge | Pendiente |

Los 11 quedaron **sin ejecutar**: la revisión fue manual en el navegador y por indicación del
usuario no se corrió el humo HTTP. El script correspondiente está fuera del repositorio, así que
no queda evidencia reproducible (ver Brechas).

Lo que **sí** se comprobó por código, sin pasar por HTTP, fue la semántica del filtro: con
`better-sqlite3` en memoria se verificó que `LIKE` sin `ESCAPE` no escapa el backslash y que
`LIKE ... ESCAPE '\'` sí, y que knex genera
`where (full_name LIKE ? ESCAPE '\' or email LIKE ? ESCAPE '\')`. Eso cierra la causa de TC-USR-005,
no el caso completo.

## Casos del catálogo de SKUs (FEATURE-003)

| ID | Precondición | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| TC-SKU-001 | Sesión válida, `searchPath = dev` | `GET /skus` | 200 con `total: 255`, `page: 1`, `lastPage: 26` y 10 SKUs ordenados por `id` asc (el primero es `id` 8) | Ejecutado |
| TC-SKU-002 | Sesión válida | `GET /skus` e inspeccionar las props | Cada fila trae solo `id`, `nombre`, `tratamiento` y `codigo`; ninguna de las otras 21 columnas de la tabla | Ejecutado |
| TC-SKU-003 | Sesión válida | `GET /skus?nombre=ortodoncia` | Filtra por `"Nombre"` con `ILIKE` (sin distinguir mayúsculas); `total` refleja el filtro | Ejecutado |
| TC-SKU-004 | Sesión válida | `GET /skus?tratamiento=500` | Coincidencia **parcial** sobre `"ID tratamiento"::text`: devuelve las 6 filas cuyo tratamiento contiene `500`, no las que contienen `5004` solo | Ejecutado |
| TC-SKU-005 | Sesión válida | `GET /skus?codigo=2.3` | Filtra por `"ID SKU"` y devuelve **3 filas**: el valor es texto y no es único | Ejecutado |
| TC-SKU-006 | Sesión válida | `GET /skus?nombre=APARATO%20DE%20ORTODONCIA&tratamiento=5004&codigo=2.3` | Los 3 filtros se combinan con `AND`: 1 fila | Ejecutado |
| TC-SKU-007 | Sesión válida | `GET /skus?nombre=%25` | Escapa el `%` con `escapeLike()`: busca un literal, no un comodín. En `dev."SKU"` **ningún nombre contiene `%`**, así que devuelve 0 filas | Ejecutado |
| TC-SKU-008 | Sesión válida | `GET /skus?nombre=_` | Escapa el `_`: devuelve 0 filas (ningún nombre lo contiene), mientras un `_` sin escapar devolvería las 255 | Ejecutado |
| TC-SKU-009 | Sesión válida | `GET /skus?page=999` | Página vacía, sin error | Ejecutado |
| TC-SKU-010 | Sesión válida | `GET /skus?page=26` | Última página: 5 filas (`id` 282, 284, 285, 286, 287) y pie `251-255 de 255` | Ejecutado |
| TC-SKU-011 | Sesión válida, un filtro activo | Paginar a la página 2 | El filtro viaja en el `qs`: `total` y las filas siguen filtradas | Ejecutado |
| TC-SKU-012 | Sesión válida | Escribir en cualquiera de los 3 buscadores y pulsar Enter | El `onKeyDown` dispara la búsqueda: con 3 inputs el navegador no hace *implicit submission* | Pendiente |
| TC-SKU-013 | Sesión válida | Inspeccionar la tabla | 7 columnas en orden: `Nombre`, `Tipo`, `Estatus`, `Familia`, `Módulo de salud`, `Especialidad` y la acción; `Tipo` = "Tratamiento", `Estatus` = pill "Activo", y `Familia`/`Especialidad`/`Módulo` = `—` (datos dummy declarados) | Ejecutado |
| TC-SKU-014 | Sesión válida | Inspeccionar el subtexto de la primera columna | `Tratamiento {tratamiento} · SKU {codigo}` con los valores reales de la fila | Ejecutado |
| TC-SKU-015 | Sin sesión | `GET /skus` | 302 a `/`: se aplica `middleware.auth()` | Ejecutado |
| TC-SKU-016 | Sesión válida | `POST /skus` | 404: `router.get()` solo registra GET; `Nuevo SKU`, `Edición masiva`, `Ordenar` y la acción por fila son maqueta | Ejecutado |

### Ejecución del filtro por HTTP (2026-10-02, autorizada por el usuario)

El usuario pidió una prueba del filtro antes del commit. Script throwaway en
`%TEMP%\opencode\verify-sku-filtro.mjs` (**no se commitea**): inserta un `magic_links` con
`token_hash = sha256(token)` en `tmp/db.sqlite3`, consume `GET /auth/magic/:token` para obtener
la cookie de sesión y luego pide `/skus` parseando el `data-page` de Inertia
(`<script data-page="app" type="application/json">`), sin navegador. Resultado: **31/31 checks
en verde**.

| # | Check | Observado |
|---|---|---|
| 1 | `GET /skus` responde 200 | 200 |
| 2 | `total` sin filtro | 255 |
| 3 | `page` 1 y `lastPage` 26 | 1 y 26 |
| 4 | 10 filas orden ascendente por `id` | `8,9,10,11,12,13,14,15,16,17` |
| 5 | `id` llega como **número**, no texto | `typeof === 'number'`, valor `8` |
| 6 | Cada fila trae solo 4 claves | `codigo,id,nombre,tratamiento` |
| 7 | `?nombre=ortodoncia` filtra y ajusta `total` | 72 |
| 8 | El nombre vuelve en las props | `"ortodoncia"` |
| 9 | Toda fila devuelta coincide (sin distinguir mayúsculas) | `APARATO DE ORTODONCIA U ORTOPEDIA AVANZADO` |
| 10 | `?tratamiento=500` coincide **parcial** | 6 |
| 11 | `?tratamiento=5004` coincide exacto | 1 |
| 12 | `tratamiento` vuelve como texto | `"5004"` (`string`) |
| 13 | `?codigo=2.3` filtra sobre el texto | 3 (el valor no es único) |
| 14 | Los 3 filtros juntos (`AND`) | 1 fila |
| 15 | `?nombre=%25` busca el `%` literal | 0 |
| 16 | `?nombre=_` busca el `_` literal | 0 |
| 17 | **Filtro + `page=2`: el `total` sigue siendo 72** | 72 |
| 18 | Filtro + `page=2` recalcula `lastPage` | 8 (72 filas / 10) |
| 19 | Filtro + `page=2` devuelve **otras** filas filtradas | ids `106,107,108` vs `8,9,10` |
| 20 | Filtro + `page=2`: el filtro vuelve en las props | `"ortodoncia"` |
| 21 | Filtro + última página (`page=8` de 72) | 2 filas |
| 22 | Filtro + `page=999` | 200 con 0 filas |
| 23 | `?page=26` sin filtro: 5 filas | 5 |
| 24 | `?page=26`: ids de la última página | `282,284,285,286,287` (id disperso) |
| 25 | `?page=26`: `total` y `lastPage` | 255 y 26 |
| 26 | `?page=999` sin filtro | 200 con 0 filas |
| 27 | `?page=0` no da 500 | 200, cae en la página 1 |
| 28 | `?page=-2` no da 500 | 200, cae en la página 1 |
| 29 | `?page=` (vacío) no da 500 | 200, cae en la página 1 |
| 30 | `GET /skus` **sin cookie** | 302 a `/` |
| 31 | `POST /skus` | 404 (solo existe `GET`) |

**Hallazgo de la prueba y corrección**: el check 5 falló en la primera pasada. `pg` devuelve los
`bigint` como texto, así que `id` viajaba como `"8"` aunque el modelo lo declara `number` y las
props lo tipan `number`. Se castea en el controller (`id: Number(sku.id)`), junto al `String()`
que ya se hacía con `tratamiento`. Los checks 27-29 son la confirmación en vivo del saneo de
`page`: sin él, `?page=0`, `?page=-2` y `?page=` devolvían 500.

**TC-SKU-012 sigue `Pendiente`** y no se puede cerrar por HTTP: el Enter que dispara la búsqueda
vive en el `onKeyDown` del formulario, en el cliente. Solo se demuestra en el navegador.

La revisión manual del usuario (mismo día) cubrió lo que el script no puede ver: **TC-SKU-013**
(7 columnas en orden, `Tipo` = "Tratamiento", pill de `Estatus`, `Familia`/`Especialidad`/`Módulo
de salud` = `-`) y **TC-SKU-014** (subtexto `Tratamiento {ID} · SKU {ID SKU}` con valores reales).
El HTML servido es el shell más el `data-page`: el markup de la tabla lo monta React en el
cliente, así que esos dos casos y el pie de paginación solo se cierran mirando la pantalla.

## Casos de seguridad transversal

| ID | Precondición | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| TC-SEC-001 | `NODE_ENV=development` | OPTIONS con `Origin: https://evil.test` | El origen se refleja y `Access-Control-Allow-Credentials: true` | Ejecutado |
| TC-SEC-002 | `NODE_ENV=production` | OPTIONS con cualquier origen | **No** se refleja; allowlist vacía | Ejecutado |
| TC-SEC-003 | Cualquier ruta | Inspectar cabeceras | `X-Frame-Options: DENY`, `Strict-Transport-Security` (180 días), `X-Content-Type-Options: nosniff` | Ejecutado |
| TC-SEC-004 | Cualquier ruta | Inspectar cabeceras | **No** hay `Content-Security-Policy` (deshabilitada en `config/shield.ts`) | Ejecutado |
| TC-SEC-005 | Sesión válida | `POST /modulos-de-salud` | 404: `router.get()` solo registra GET | Ejecutado |
| TC-SEC-006 | Sin sesión | Cualquier ruta del panel | 302 a `/`, nunca se ejecuta el controller | Ejecutado |
| TC-SEC-007 | `users` con email | `GET /auth/magic/:token` y luego mirar `magic_links` | `token_hash` es SHA-256; el token en claro no está en la BD | Ejecutado |

## Referencias
- [Estrategia de pruebas](test-strategy.md)
- [Autenticación](../05-api/authentication.md)
- [Contratos HTTP](../05-api/http-contracts.md)
- [Requisitos de seguridad](../06-security/security-requirements.md)

## Brechas

- **Nada está automatizado**: 30 casos ejecutados a mano no son cobertura, son confianza en la
  memoria de quien los hizo.
- **No hay evidencia persistente**: la columna "Evidencia" está vacía en todos los casos; un smoke
  manual no deja registro reproducible.
- **Casos sin ejecutar** (TC-AUT-012, TC-USR-001…011) y sin descubrir: la tabla documenta lo que se
  probó, no la cobertura completa. Los de usuarios están escritos pero pendientes a propósito.
- **Sin casos negativos de UI**: no hay prueba de mensajes de error visibles al usuario (por
  ejemplo, los errores de validación del formulario de login).
- **Sin casos de regresión asociados a incidentes**: no hay forma de saber qué casos existían
  antes para detectar una repetición.
