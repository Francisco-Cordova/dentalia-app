# Requisitos de seguridad

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

Identificación `SEC-<NNN>`. Cada requisito indica **cómo se cumple hoy** (con referencia al código o a
una verificación por HTTP) o, si no se cumple, en la sección de Brechas.

## Matriz de requisitos

| ID | Requisito | Cumplimiento | Evidencia |
|---|---|---|---|
| SEC-001 | Toda ruta del panel exige sesión | **Cumple** | `middleware.auth()`; `/insumos` sin sesión → 302 a `/` (verificado) |
| SEC-002 | Las rutas públicas expulsan a quien ya tiene sesión | **Cumple** | `middleware.guest()` en el grupo público |
| SEC-003 | Las operaciones de escritura exigen token CSRF | **Cumple** | `config/shield.ts:33,49`; logout sin XSRF → sesión **intacta** (verificado) |
| SEC-004 | El token de acceso es de un solo uso | **Cumple con ventana** | `used_at IS NULL` + escritura; reutilización → 302 (verificado) |
| SEC-005 | El token de acceso tiene vigencia limitada | **Cumple** | `TOKEN_TTL_MINUTES = 30`; `expires_at` verificado |
| SEC-006 | El token nunca se almacena en claro | **Cumple** | Se persiste `sha256(token)` en `token_hash` |
| SEC-007 | El token se genera con entropía criptográfica | **Cumple** | `randomBytes(32).toString('hex')` |
| SEC-008 | Las contraseñas se almacenan con hash adaptativo | **Cumple** | Mixin `withAuthFinder(hash)` (scrypt); nunca se compara ni registra en claro |
| SEC-009 | No se enumeran usuarios en el login | **Cumple** | Mismo mensaje y status para correo registrado y no registrado (verificado) |
| SEC-010 | La cookie de sesión es HttpOnly | **Cumple** | `config/session.ts:41` |
| SEC-011 | La cookie de sesión restringe envío cross-site | **Cumple** | `SameSite=Lax` |
| SEC-012 | La cookie de sesión solo viaja por HTTPS en producción | **Cumple** | `secure: app.inProduction` |
| SEC-013 | El identificador de sesión se regenera al iniciar sesión | **Cumple** | Garantía del guard; verificado por `auth.use('web').login()` |
| SEC-014 | El identificador de sesión se invalida al cerrar sesión | **Cumple** | `auth.use('web').logout()`; `/skus` → 302 tras logout |
| SEC-015 | Los datos de sesión no se exponen al JavaScript del cliente | **Parcial** | Los datos viven cifrados en la cookie (`SESSION_DRIVER=cookie`), pero el payload viaja al navegador: depende de la confidencialidad de `APP_KEY` |
| SEC-016 | El password nunca se serializa al cliente | **Cumple** | `UserTransformer` hace `pick` explícito sin `password` |
| SEC-017 | Se impide el clickjacking | **Cumple** | `X-Frame-Options: DENY` (verificado) |
| SEC-018 | Se impide el MIME sniffing | **Cumple** | `X-Content-Type-Options: nosniff` (verificado) |
| SEC-019 | Se fuerza HTTPS (HSTS) | **Cumple con defecto** | `max-age=15552000` (180 días), **activo también en DEV** |
| SEC-020 | Existe una CSP que restringe los recursos cargados | **No cumple** | `config/shield.ts:12` `enabled: false`; cabecera ausente (verificado) |
| SEC-021 | El acceso cross-origin está restringido a orígenes conocidos | **Cumple en PROD, falla en DEV** | `origin: app.inDev ? true : []` con `credentials: true` |
| SEC-022 | Las consultas al catálogo resisten pérdida de conexión | **Cumple** | `withConnectionRetry` (1 reintento) + keepalive + pool |
| SEC-023 | Las consultas al catálogo escapan metacaracteres de `LIKE` | **Cumple** | `escapeLike()` escapa `%` y `_` |
| SEC-024 | Las entradas de usuario se validan antes de tocar la BD | **Cumple** | VineJS en los 3 validators |
| SEC-025 | El catálogo no se modifica desde la aplicación | **Cumple** | `migrations.paths: []`; solo `SELECT` |
| SEC-026 | Las entradas de BD parametrizadas (sin concatenar SQL) | **Cumple** | Lucid/Knex parametrizan; los `ORDER BY` son columnas fijas del código |
| SEC-027 | Hay rate limiting en las operaciones sensibles | **No cumple** | Sin `config/rate_limiter.ts` ni throttle |
| SEC-028 | Hay control de acceso por rol | **No cumple** | No hay RBAC: `users` no tiene campo de rol ni permisos |
| SEC-029 | Hay segundo factor de autenticación | **No cumple** | — |
| SEC-030 | Hay registro de auditoría de accesos | **No cumple** | Sin tabla de auditoría ni logs de seguridad propios |
| SEC-031 | Los errores en producción no filtran detalle interno | **Cumple** | `debug = !app.inProduction`; páginas de error propias |
| SEC-032 | El certificado TLS del servidor de BD se valida | **No cumple** | `ssl.rejectUnauthorized: false` |
| SEC-033 | Los secretos viven fuera del repositorio | **Cumple** | `.env` gitignored; `.env.example` es placeholder |
| SEC-034 | Los logs no contienen secretos | **Parcial** | No se loguean contraseñas ni tokens, pero DEV loguea la URL completa del magic link (`[MAGIC LINK DEV] <url>`), que contiene el token en claro |

## Hallazgos priorizados

| # | Hallazgo | Severidad | Mitigación actual |
|---|---|---|---|
| 1 | **Autoregistro abierto sin verificación de correo** (`POST /signup`): autentica de inmediato y permite tomar la identidad de cualquier correo válido | **Alta** | Ninguna. La ruta no está enlazada desde el login, lo que solo reduce el descubrimiento |
| 2 | **CORS refleja cualquier origen con `credentials: true` en DEV** y sin `Vary: Origin` | **Alta en DEV** | `SameSite=Lax` impide que la cookie viaje en XHR cross-site, lo que reduce el impacto real |
| 3 | **Sin rate limiting** en `POST /login/magic`: emisión ilimitada de enlaces y envío de correo | Media | Ninguna |
| 4 | **CSP deshabilitada**: sin restricción de scripts ni de origen de recursos | Media | `X-Frame-Options` y `nosniff` |
| 5 | **`ssl.rejectUnauthorized: false`**: no se valida el certificado de Supabase | Media | El tráfico va por TCP con TLS, pero es susceptible a MITM |
| 6 | **HSTS activo en DEV**: el navegador recuerda el dominio y bloquea HTTP | Baja | `max-age` de 180 días es largo |
| 7 | **Token de magic link en claro en los logs de DEV** | Baja (entorno) | Solo en DEV |
| 8 | **Consumo de token no atómico**: dos peticiones simultáneas podrían autenticar | Baja | Ventana muy estrecha |
| 9 | **Sin auditoría**: no hay rastro de accesos, cambios ni exports | Media | Los logs del servidor no cubren intención de seguridad |

## Referencias
- [Autenticación](authentication.md)
- [Autorización](authorization.md)
- [Roles y permisos](roles-permissions.md)
- [Gestión de secretos](secrets-management.md)
- [Clasificación de datos](data-classification.md)
- [Política de auditoría](audit-policy.md)
- `config/shield.ts`, `config/cors.ts`, `config/session.ts`, `config/database.ts`, `config/encryption.ts`
