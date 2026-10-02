# Roles y permisos

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Matriz de permisos

**No hay matriz.** El sistema tiene un único estado de acceso.

| Estado | Se alcanza | Puede ver el panel | Puede crear cuentas | Puede escribir en el catálogo |
|---|---|---|---|---|
| Visitante (sin sesión) | Navegación directa | No (302 a `/`) | **Sí**, vía `POST /signup` (no enlazado desde la UI) | No |
| Usuario con sesión | Magic link | **Sí, todo** | No (no hay interfaz de gestión) | No (solo lectura) |

No existen los roles "administrador", "editor" ni "consulta" que sugiere la sección "Admin" del
sidebar. `users` **ya tiene** columnas `area`, `rol` y `superadmin` (añadidas por la migración
`1780000000000_add_area_rol_superadmin_to_users_table`), pero **no hay matriz de permisos**: son
datos que el catálogo de `/usuarios` muestra y que ninguna decisión del servidor lee. Añadir la
columna no creó RBAC.

## Inventario de entidades de autorización

| Entidad | ¿Existe? | Nota |
|---|---|---|
| `roles` | No | — |
| `permissions` | No | — |
| `user_roles` | No | — |
| `users.rol` | **Sí** | `string` nullable. Dato de pantalla; no se lee en ninguna decisión de acceso |
| `users.superadmin` | **Sí** | `boolean`, default `false`. Igual que `rol`: se muestra, no manda |
| `sessions` | No | `SESSION_DRIVER=cookie` |
| `audit_log` | No | — |

## Cómo se autoriza hoy

1. `middleware.auth()` llama a `ctx.auth.authenticateUsing()`.
2. Si no hay usuario en sesión, redirige a `/` (no a un 403).
3. Si lo hay, `next()`: el controller se ejecuta sin más comprobaciones.

No hay paso 3. La única decisión que queda en el servidor es "hay sesión".

## Referencias
- [Autorización](authorization.md)
- [Usuarios](../02-functional-design/user-roles.md)
- `app/middleware/`, `app/models/user.ts`

## Brechas

- **Todo usuario autenticado es equivalente a un administrador**: si el catálogo llegara a incluir
  operaciones de escritura, cualquiera con un enlace podría ejecutarlas.
- **`POST /signup` concede el mismo estado que un acceso concedido**: el alta es el camino más fácil
  a "usuario con sesión".
- **No hay forma de revocar el acceso de un usuario concreto**: `users.rol` y `users.superadmin`
  existen pero no se leen, así que no sirven para revocar nada, y sin rotación de `APP_KEY` (que
  echaría a todos), un usuario con sesión la conserva hasta que caduquen las 2 h de inactividad o se
  borre su fila (`magic_links` cae en cascada, pero la sesión vive en la cookie).
- **No hay separación de responsabilidades** entre quien opera el panel y quien gestiona el
  catálogo externo en Supabase.
