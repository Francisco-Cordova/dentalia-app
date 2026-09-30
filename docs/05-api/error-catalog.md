# Catálogo de errores

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

No existe una taxonomía de errores de negocio con códigos: los mensajes se escriben a mano en cada
controller y llegan al usuario como **flash** (que el cliente muestra con `sonner`) o como
`errors` de validación. Esta tabla es el inventario real.

## Errores de validación (VineJS)

| Origen | Campo | Mensaje al usuario | Respuesta |
|---|---|---|---|
| `magicLinkValidator` | `email` | Formato o longitud inválida (1–254) | 422 + `errors.email` |
| `signupValidator` | `email` | Correo ya registrado (`unique` contra `users.email`) | 422 + `errors.email` |
| `signupValidator` | `password` | Menos de 8 o más de 32 caracteres, o no coincide con la confirmación | 422 + `errors.password` |
| `signupValidator` | `passwordConfirmation` | Requerida | 422 + `errors.passwordConfirmation` |

Los errores viajan en el prop compartido `errors` (`ctx.inertia.always(...)`) y se leen en el
formulario como `{({ errors }) => errors.email}`.

## Flash de sesión (mensajes al usuario)

| Mensaje | Origen | Disparador |
|---|---|---|
| `Si tu correo está registrado, recibirás un enlace de acceso.` | `magic_link_controller.ts:45` | `POST /login/magic`, sea cual sea el resultado (registrado o no) |
| `El enlace es inválido o ya expiró. Solicita uno nuevo.` | `magic_link_controller.ts:60` | Token no encontrado, expirado o ya usado |
| `Invalid or expired CSRF token` | `@adonisjs/shield` | `POST` sin `x-xsrf-token` válido |

## Errores de aplicación

| Situación | Resultado | Evidencia |
|---|---|---|
| Token de magic link inválido/expirado/reutilizado | 302 a `/` + flash de error | `magic_link_controller.ts:59-62` |
| SMTP caído en DEV | Se registra; respuesta normal (302 atrás) + `[MAGIC LINK DEV] <url>` en el log | `:35-42` |
| SMTP caído en producción | El error se relanza → 500 | `:40` |
| Corte de conexión con Supabase | `withConnectionRetry` reintenta una vez; si vuelve a fallar, sube a `handle()` | `app/services/with_connection_retry.ts` |
| `SUPABASE_DB_URL` sin `:PASSWORD` | `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string` | Error del driver `pg` |

## Páginas de error

| Código | Render | Condición |
|---|---|---|
| 404 | `inertia/pages/errors/not_found.tsx` | Solo en **producción** (`renderStatusPages = app.inProduction`) |
| 500–599 | `inertia/pages/errors/server_error.tsx` | Solo en **producción** |

En DEV, `debug = !app.inProduction` hace que se muestre la página de depuración de AdonisJS con el
detalle de la excepción (se observó una respuesta 404 de ~52 KB).

## Brechas

- **Sin códigos de error**: todo es texto libre. No hay identificador estable para que el cliente o
  un monitor distinga "correo no registrado" de "SMTP caído".
- **Mensajes con doble espacio** (`acceso de acceso`) en el flash del magic link: detalle cosmético
  de copy.
- **El detalle del driver se expone en DEV**: correcto para desarrollo, pero si un ambiente
  compartido quedara con `NODE_ENV != production`, el mensaje de PostgreSQL saldría al cliente.
- **Los 500 no tienen correlación**: hay `request_id` en los logs del servidor, pero no se devuelve
  al cliente ni se propaga a Supabase ni al SMTP.
- **Errores de Inertia no se normalizan**: en navegaciones Inertia los errores de validación llegan
  como prop; en recargas de página, como respuesta HTML. No hay contrato único.
- **`errors` no distingue campos anidados**: con el esquema plano actual no se nota, pero al
  aparecer objetos en los payloads habría que migrar el acceso en el cliente.
