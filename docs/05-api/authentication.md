# Autenticación (frontera)

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Mecanismo

| Aspecto | Implementación |
|---|---|
| Guard | `web` (`sessionGuard`), el único. `default: 'web'` en `config/auth.ts:9` |
| Proveedor | `sessionUserProvider` sobre `User` |
| Sesión | Cookie `adonis-session`, `HttpOnly`, `SameSite=Lax`, `Secure` solo en producción, `age: '2h'` |
| Almacén | **Cookie cifrada** (`SESSION_DRIVER=cookie`). No hay estado en servidor |
| `useRememberMeTokens` | `false` |
| Credenciales | Magic link (hash SHA-256 del token) y, en código muerto, contraseña |

## Flujos expuestos

| Flujo | Ruta | Estado |
|---|---|---|
| Magic link: pedir | `POST /login/magic` | **Activo** |
| Magic link: consumir | `GET /auth/magic/:token` | **Activo** |
| Alta de cuenta | `POST /signup` | Activo pero **no enlazado** desde la UI |
| Login por contraseña | `SessionController.store` | **Inalcanzable**: sin ruta |
| Logout | `POST /logout` | Activo (`session.destroy`) |

## Ciclo de vida de un enlace

1. `randomBytes(32).toString('hex')` genera el token en claro.
2. Se persiste `sha256(token)` en `magic_links.token_hash` con `expires_at = +30 min`.
3. El correo lleva `{APP_URL}/auth/magic/{token}`.
4. Al abrirlo: `where('token_hash', hash).whereNull('used_at')`, se valida `expires_at`, se escribe
   `used_at`, se hace `auth.use('web').login(user)` y se redirige a `/skus`.

Verificado por HTTP: token reutilizado → 302 a `/`; `used_at` queda escrito; `expires_at` =
emisión + 30 min.

## Protección de rutas

- `middleware.auth()` (`app/middleware/auth_middleware.ts:22`) llama
  `authenticateUsing(..., { loginRoute: '/' })`. Sin sesión → 302 a `/`, guardando la URL pretendida
  en sesión.
- `middleware.guest()` en el grupo público hace el inverso: con sesión → redirige.
- `middleware.silent_auth_middleware.ts` ejecuta `ctx.auth.check()` en **todas** las rutas para que
  el prop compartido `user` esté disponible sin exigir sesión.

## Contrato de sesión

| Elemento | Valor |
|---|---|
| Nombre de cookie | `adonis-session` |
| HttpOnly | Sí |
| SameSite | `Lax` |
| Secure | `app.inProduction` (en DEV es `false`) |
| Antigüedad | 2 h de inactividad |
| Regeneración de ID | Al iniciar sesión (garantía del guard de sesión) |

## Referencias
- [Flujo de autenticación](../02-functional-design/flows/FLOW-AUT-001.md)
- [Seguridad: autenticación](../06-security/authentication.md)
- [Contratos HTTP](http-contracts.md)

## Brechas

- **Sin rate limiting** en `POST /login/magic`: se pueden emitir enlaces ilimitadamente (y disparar
  correos) desde una sola IP.
- **Respuesta genérica pero sin alta automática**: quien no existe en `users` no recibe nada y no se
  le dice. La UX depende de un usuario previo sembrado.
- **El consumo de token no es atómico**: la comprobación (`used_at IS NULL`) y la escritura son
  separadas, así que dos peticiones simultáneas con el mismo token podrían autenticar ambas.
- **`/signup` autentica de inmediato sin verificar el correo**: cualquier persona con un buzón
  puede tomar la identidad de un correo de la clínica. No está enlazado desde el login, lo que
  reduce la exposición pero no la elimina (la URL es adivinable).
- **La fila de `magic_links` se crea antes del envío**: si SMTP falla, queda un enlace válido que el
  usuario nunca recibió.
- **Login por contraseña sin controles**: `SessionController.store` no es alcanzable, así que hoy
  no expone superficie. Si alguien lo montara, quedaría sin intentos limitados, sin bloqueo de
  cuenta y sin MFA.
- **Sin recuperación de contraseña ni segundo factor**: el único control es el acceso al buzón.
