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
| TC-AUT-008 | Con cookie de sesión | `GET /skus` | 200 renderizando `skus` con `user` y 9 productos | Ejecutado |
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
- **Casos sin ejecutar** (TC-AUT-012) y sin descubrir: la tabla documenta lo que se probó, no la
  cobertura completa.
- **Sin casos negativos de UI**: no hay prueba de mensajes de error visibles al usuario (por
  ejemplo, los errores de validación del formulario de login).
- **Sin casos de regresión asociados a incidentes**: no hay forma de saber qué casos existían
  antes para detectar una repetición.
