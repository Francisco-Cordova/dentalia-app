# Módulos

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2278659, 5b4f99b |

El sistema tiene hoy tres módulos. Cada uno corresponde a un grupo de archivos real; las
fronteras son observables en el código.

---

## Autenticación (`AUT`)

**Objetivo:** permitir el acceso al panel sin contraseña y mantener la sesión abierta.

**Responsabilidades**
- Solicitar, emitir y verificar el enlace de acceso por correo (`app/controllers/magic_link_controller.ts`).
- Crear y destruir la sesión (`app/controllers/session_controller.ts`, guard `web` de `config/auth.ts`).
- Proteger las rutas del panel (`middleware.auth()`) y expulsar a quien ya está autenticado (`middleware.guest()`).
- Enviar el correo con el enlace (`app/mails/magic_link_mail.ts` + vista Edge).

**No es responsable de**
- Autorización por rol o permiso: **no existe**. Solo distingue autenticado de no autenticado.
- Gestión de usuarios (alta, edición, baja) — la pantalla `/usuarios` es maqueta.
- Recuperación de contraseña o MFA: no existen.

**Dependencias**
- Sesión y cookies (`config/session.ts`), cifrado AES-256-GCM (`config/encryption.ts`), guard CSRF (`config/shield.ts`).
- Correo saliente vía SMTP (`config/mail.ts`).
- SQLite: tablas `users` y `magic_links`.

**Archivos**

| Archivo | Rol |
|---|---|
| `app/controllers/magic_link_controller.ts` | `send` (solicita) y `verify` (valida y autentica) |
| `app/controllers/session_controller.ts` | `create` (login) y `destroy` (logout) |
| `app/middleware/auth_middleware.ts` | Exige sesión; redirige a `/` guardando la URL pretendida |
| `app/middleware/guest_middleware.ts` | Redirige a `/skus` si ya hay sesión |
| `app/middleware/silent_auth_middleware.ts` | Hidrata el usuario sin bloquear, para páginas públicas |
| `app/middleware/inertia_middleware.ts` | Comparte `user` y `errors` a todas las páginas |
| `app/models/user.ts`, `app/models/magic_link.ts` | Modelos Lucid |
| `app/validators/user.ts` | `signupValidator`, `loginValidator` (sin uso), `magicLinkValidator` |
| `inertia/pages/auth/login.tsx` | Pantalla de login (solo correo) |

---

## Catálogo (`INS`)

**Objetivo:** consultar el catálogo de insumos de Supabase con búsqueda y paginación.

**Responsabilidades**
- Consultar `dev."Insumos"` en solo lectura (`app/controllers/insumos_controller.ts`, `app/models/insumo.ts`).
- Resolver el schema de trabajo (`searchPath: ['dev','public']`) y proteger la conexión de Supabase.
- Exponer al cliente datos planos (filas, total, página, filtros) sin depender del formato de `paginate()`.
- Presentar la tabla, los buscadores y la paginación (`inertia/pages/insumos.tsx`).

**No es responsable de**
- Escrituras, altas o ediciones de insumos: el catálogo es externo y de solo lectura.
- SKU, familias, kits, zonas, módulos de salud y usuarios: son pantallas maqueta sin conexión a datos.
- Caché del catálogo: cada visita a `/insumos` vuelve a Supabase.

**Dependencias**
- Supabase (PostgreSQL) vía `pg`, con SSL, keepalive, pool acotado y reintento de conexión.
- Helper `withConnectionRetry()` ante cortes de conexión inactiva.

**Archivos**

| Archivo | Rol |
|---|---|
| `app/models/insumo.ts` | Modelo Lucid sobre `supabase."Insumos"`; mapea columnas a campos de UI |
| `app/controllers/insumos_controller.ts` | Filtros `nombre`/`codigo`, paginación y render |
| `app/services/with_connection_retry.ts` | Reintento único ante error de conexión |
| `inertia/pages/insumos.tsx` | Tabla, buscadores, paginación |
| `config/database.ts` | Conexión `supabase` (searchPath, pool, keepAlive) |

---

## Shell del panel (`ADM`)

**Objetivo:** marco visual y navegación común del área autenticada.

**Responsabilidades**
- Sidebar con grupos colapsables y marcado del ítem activo (`inertia/layouts/admin.tsx`).
- Selección de layout: auth vs panel (`inertia/layouts/default.tsx`).
- Menú de usuario con cierre de sesión.
- Toasts a partir de los mensajes flash de sesión (`sonner`).
- Estilos globales de la aplicación (`inertia/css/app.css`).

**No es responsable de**
- Lógica de negocio ni acceso a datos.
- Autorización: refleja lo que el módulo de Autenticación le entrega.

**Dependencias**
- Rutas nombradas (Tuyau) para los enlaces del sidebar.
- Props compartidas `user` y `errors` del middleware de Inertia.
- `inertia/components/icon.tsx` para el set de iconos.

---

## Brechas

- **No existe módulo de autorización**: `roles-permissions`, policies y abilities están vacíos; el control de acceso es binario.
- **No existe módulo de catálogo para el resto del dominio**: SKU, familias, kits, zonas, módulos de salud y usuarios viven como páginas que importan arrays hardcodeados. Cada uno necesitará su módulo al pasar a datos reales.
- **No existe módulo de API**: `providers/api_provider.ts` y el registro de Tuyau están montados, pero ninguna ruta devuelve JSON.
- Los límites entre módulos se apoyan en convención (rutas en `start/routes.ts`, alias `#models/*`, `#services/*`) y no en una capa de dominio o casos de uso.
