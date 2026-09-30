# Autenticación

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Implementación

| Control | Mecanismo | Referencia |
|---|---|---|
| Emisión de enlace | Token de 32 bytes en hex, persistido **hasheado** con SHA-256 | `magic_link_controller.ts:21-29` |
| Vigencia | 30 minutos | `TOKEN_TTL_MINUTES` |
| Un solo uso | `used_at IS NULL` en la consulta + escritura al consumir | `:53-65` |
| Generación de sesión | `auth.use('web').login(user)` (regenera el identificador) | `:67` |
| Cierre de sesión | `auth.use('web').logout()` | `session_controller.ts:19` |
| Cookies | `HttpOnly`, `SameSite=Lax`, `Secure` en producción, 2 h | `config/session.ts:32-52` |
| Cifrado de sesión | AES-256-GCM con `APP_KEY` | `config/encryption.ts:11` |

## Por qué no hay contraseñas en el camino crítico

`users.password` existe y es `NOT NULL` porque `POST /signup` lo exige, y se hashea con scrypt por
el mixin `withAuthFinder(hash)`. Pero **ninguna ruta montada verifica contraseñas**:
`SessionController.store` es código muerto. El único acceso real es el enlace por correo.

## Verificaciones realizadas

| Prueba | Resultado |
|---|---|
| Magic link con correo registrado | 302 atrás + flash; fila creada en `magic_links` |
| Magic link con correo **no** registrado | 302 atrás + flash; **0 filas**, 0 usuarios |
| Token válido | 302 a `/skus`; `used_at` escrito; `expires_at` = +30 min |
| Token **reutilizado** | 302 a `/` con flash de error |
| Ruta protegida sin sesión | 302 a `/` |
| `POST /logout` sin `x-xsrf-token` | 302; **la sesión sobrevive** |
| `POST /logout` con token válido | 302 a `/`; la sesión muere |
| SMTP caído (DEV) | Se loguea `[MAGIC LINK DEV] <url>`; la respuesta es la misma |

## Fortalezas

- El token nunca se guarda en claro: una filtración de `magic_links` no permite autenticar.
- No hay enumeración de usuarios: la respuesta es idéntica exista o no la cuenta.
- La sesión sobrevive reinicios del servidor (los datos van cifrados en la cookie del cliente).
- El identificador de sesión se regenera al iniciar sesión, lo que mitiga fijación de sesión.

## Debilidades

- **No hay rate limiting**: `POST /login/magic` es un endpoint público sin límite de intentos ni de
  frecuencia de envío de correo.
- **No hay segundo factor ni recuperación**: el acceso depende por completo del buzón.
- **No hay invalidación global**: no hay forma de cerrar todas las sesiones de un usuario salvo
  rotar `APP_KEY`.
- **No hay registro de intentos fallidos**: un ataque de fuerza bruta sobre el buzón no deja rastro
  propio.

## Referencias
- [Requisitos de seguridad](security-requirements.md)
- [Flujo de autenticación](../02-functional-design/flows/FLOW-AUT-001.md)

> No existe `password-policies.md` en este repositorio. La única política aplicada es la del
> validador de `POST /signup` (8–32 caracteres con confirmación), irrelevante para el login real
> porque ese flujo es código muerto. La ausencia del documento es una brecha.
