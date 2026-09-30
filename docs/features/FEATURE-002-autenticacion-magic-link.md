# FEATURE-002 · Autenticación por enlace mágico (magic link)

## Estado
DONE

## Objetivo
Permitir el acceso al panel sin contraseña, mediante un enlace de un solo uso enviado al correo
registrado, con sesión cifrada y protección CSRF en las operaciones de escritura.

## Requirement relacionado
- RF-AUT-001, RF-AUT-002, RF-AUT-003

## Reglas de negocio
- BR-AUT-001, BR-AUT-002, BR-AUT-003, BR-AUT-004, BR-AUT-005, BR-AUT-006

## Actor
Administrador (usuario registrado) y Visitante (sin sesión).

## Permisos
- Público: solicitar enlace y verificar token.
- `sesion:delete`: cerrar sesión.

## Flujo
1. El visitante abre `/` e introduce su correo.
2. `POST /login/magic` valida el correo y, si el usuario existe, genera un token de 32 bytes.
3. Se persiste solo el sha256 del token, con expiración a 30 minutos.
4. Se envía el correo con `{APP_URL}/auth/magic/{token}` y se responde con un mensaje genérico.
5. `GET /auth/magic/:token` busca por hash con `used_at IS NULL`, marca `used_at`, inicia sesión
   (regenerando el identificador de sesión) y redirige a `/skus`.
6. El menú de usuario permite `POST /logout`, que destruye la sesión.

## Datos involucrados
- `users` (`id`, `email` único, `full_name`, `password`, timestamps).
- `magic_links` (`user_id`, `token_hash` único, `expires_at`, `used_at`, timestamps).
- Sesión: cookie `adonis-session` + cookie de datos cifrada (AES-256-GCM), 2 h.

## API
- `GET /` → `session.create` (renderiza `auth/login`).
- `POST /login/magic` → `magic_link.send`.
- `GET /auth/magic/:token` → `magic_link.verify`.
- `POST /signup` → `new_account.store` (**ruta activa sin verificación de correo**).
- `POST /logout` → `session.destroy`.
- Sin API JSON: no hay endpoint programático de autenticación.

## UX/UI
- Página: `inertia/pages/auth/login.tsx` (solo correo, en español).
- Layout: `inertia/layouts/default.tsx` elige el layout de auth para `/` y `/signup`.
- Toasts: los mensajes flash se muestran con `sonner` desde `default.tsx`.
- Menú de sesión: `inertia/layouts/admin.tsx:155-180`.

## Criterios de aceptación
- [x] AC-AUT-001 · La respuesta es genérica: no revela si el correo existe.
- [x] AC-AUT-002 · El token se persiste solo como sha256.
- [x] AC-AUT-003 · El enlace vence a los 30 minutos.
- [x] AC-AUT-004 · El enlace es de un solo uso.
- [x] AC-AUT-005 · Verificar un enlace válido inicia sesión (302 a `/skus` + cookies `HttpOnly`, `Lax`, 2 h).
- [x] AC-AUT-006 · Cerrar sesión invalida el acceso a las rutas protegidas.
- [x] AC-AUT-007 · Cerrar sesión sin token CSRF no destruye la sesión.

## Casos límite
- Token expirado, ya usado o inexistente: mismo mensaje, sin revelar cuál fue.
- SMTP caído: en DEV la URL se registra como `[MAGIC LINK DEV]`; en PROD devuelve 500.
- Varios enlaces vivos simultáneos para el mismo usuario: los previos no se invalidan.
- Dos peticiones concurrentes con el mismo token (ventana TOCTOU).
- Token en la URL: queda en logs y cabeceras `Referer`.

## Pruebas esperadas
### Unitarias
- El hash almacenado es el sha256 del token.
- La expiración se calcula a 30 minutos.

### Integración
- Solicitud con correo inexistente: no crea fila y devuelve el mismo mensaje.
- Verificación de token usado: no autentica.
- `POST /logout` sin CSRF: se rechaza y la sesión sobrevive.
- `POST /logout` con CSRF: destruye la sesión.

### E2E
- Login completo por enlace (con Mailtrap o con el token del log en DEV) → `/skus` → logout →
  `/skus` redirige a `/`.

## Dependencias
- `users` y `magic_links` creadas por migración (`database/migrations/`).
- SMTP configurado (`config/mail.ts`, credenciales de Mailtrap en `.env`).
- `node ace db:seed` crea el usuario de pruebas (`francisco.cordova@konfront.mx`).

## Riesgos
- **Sin rate limiting** en `POST /login/magic` y `/signup` → agotamiento del buzón SMTP y correos
  no deseados.
- **`/signup` público sin verificar correo** → cualquiera obtiene sesión con permisos de
  administrador.
- **Token en la URL** sin `Referrer-Policy` ni CSP → exposición por logs y referer.
- **Token en claro en logs de DEV** (`[MAGIC LINK DEV]`).
- **TOCTOU** en el uso del token.
- **`logout()` no invalida el identificador de sesión**, solo olvida sus datos.
- **Cero tests**: el único mecanismo de validación son scripts de humo.

## Ready for Development
- [x] Requirement definido.
- [x] Reglas de negocio identificadas.
- [x] Impacto en datos definido (SQLite).
- [x] API definida (rutas Inertia; sin API JSON).
- [x] Permisos definidos.
- [x] UX/UI disponible.
- [x] Criterios de aceptación verificables.
- [x] Dependencias y riesgos visibles.
- [x] Decisiones bloqueantes resueltas (ADR-002).

## Definition of Done
- [x] Implementación completa.
- [x] Pruebas aprobadas (smoke manual: magic link, expiración, uso único, logout, CSRF).
- [x] Code Review aprobado.
- [ ] CI aprobado — **no disponible: el proyecto no tiene CI** (brecha).
- [x] API/BD/docs actualizados.
- [ ] QA/UAT completado — **no aplica: no hay ambiente de pruebas**.

## Evidencia
- Commits: `9d07876` (login y primer dashboard de SKUs), `5b4f99b` (ajustes de sesión).
- Archivos: `app/controllers/magic_link_controller.ts`, `app/controllers/session_controller.ts`,
  `app/controllers/new_account_controller.ts`, `app/middleware/{auth,guest,silent_auth,inertia}_middleware.ts`,
  `app/models/{user,magic_link}.ts`, `config/{session,shield,encryption,auth,mail}.ts`,
  `inertia/pages/auth/login.tsx`.
- Verificación de logout y CSRF por HTTP: ver [AC-AUT-006 y AC-AUT-007](../01-requirements/acceptance-criteria.md).

## Brechas
- Sin rate limiting, sin MFA, sin recuperación de contraseña, sin bloqueo por intentos.
- `SessionController.store` (login por contraseña) es **código muerto**: no hay ruta que lo monte.
- `users.password` es obligatorio aunque el sistema no usa contraseñas.
- `magic_links` no se depura: los tokens usados y expirados se acumulan sin límite.
- No hay CSP ni `Referrer-Policy`.
- No hay registro de auditoría de accesos (login/logout).
