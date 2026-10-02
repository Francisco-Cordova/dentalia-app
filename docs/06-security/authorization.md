# Autorización

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Conclusión principal

**No existe control de acceso.** La autorización es binaria: hay sesión o no la hay. No hay roles,
ni permisos, ni políticas por recurso.

## Lo que sí hay

| Mecanismo | Alcance | Referencia |
|---|---|---|
| `middleware.auth()` | Todas las rutas del panel | `app/middleware/auth_middleware.ts` |
| `middleware.guest()` | Todas las rutas públicas | `app/middleware/guest_middleware.ts` |
| `middleware.silent_auth_middleware.ts` | `ctx.auth.check()` en todas las rutas, sin bloquear | Permite que el prop `user` exista en páginas públicas |

No hay Bouncer, ni policies, ni `authorize()`, ni scopes por usuario en Lucid.

## Consecuencia

Cualquier persona autenticada puede ver **todas** las pantallas, incluidas las de administración
(`/usuarios`, `/zonas`, `/modulos-de-salud`, `/skus`). No hay separación entre "administrador" y
"consulta", aunque la taxonomía del panel sugiera esa distinción (sección "Admin" del sidebar).

`users` tiene columnas `area`, `rol` y `superadmin`, pero **no se leen para autorizar nada**: son
datos que el catálogo de `/usuarios` muestra porque la referencia de diseño los trae. `superadmin`
en `true` no abre ni cierra ninguna puerta, y `rol` no filtra ninguna consulta. Tampoco existe forma
de gestionar quién accede a qué: no hay ruta que escriba esas columnas.

## Modelo de datos

```
users ─┬─ magic_links
       └─ (nada más)
```

Sin `roles`, `permissions`, `user_roles`, ni ninguna tabla de relación. Las columnas `area`, `rol` y
`superadmin` viven **dentro** de `users` en lugar de en tablas propias, lo que refuerza que son
atributos informativos y no un modelo de permisos.

## Principios que aplica el código

- **Denegar por defecto**: el grupo `auth` cubre todo el panel; una ruta nueva nace protegida salvo
  que se añada explícitamente al grupo `guest`.
- **Validación en el servidor**: la comprobación de sesión ocurre en middleware, no en el cliente.
  La UI oculta enlaces según `user`, pero eso es comodidad, no seguridad.
- **Mínimo privilegio**: no aplica, porque no hay niveles que distinguir.

## Referencias
- [Roles y permisos](roles-permissions.md)
- [Requisitos de seguridad](security-requirements.md)
- [Usuarios](../02-functional-design/user-roles.md)

## Brechas

- **SEC-028 incumplido**: no hay RBAC. Cualquier sesión accede a todo el panel.
- **No hay matriz de permisos** que revisar ni mantener: cuando se añada, no hay punto de partida.
- **Tener columnas `rol` y `superadmin` es peor que no tenerlas**: parecen un control de acceso y
  no lo son. Quien lea el modelo puede concluir que existe un superusuario privileged, y no lo hay.
  Si algún día se implementa RBAC de verdad, habrá que decidir qué hacer con esos datos: migrarlos a
  tablas de roles o dejarlos como informativo sin usar.
- **La ausencia de roles no está justificada en ningún documento**: si el producto solo tiene un
  tipo de usuario, debería escribirse explícitamente para que la ausencia sea una decisión y no un
  olvido.
- **Sin modelo de tenancy**: si mañana aparece un cliente que necesita ver solo su clínica, el
  esquema actual no lo soporta sin migración.
- **El filtro activo del sidebar no es una política**: `inertia/layouts/admin.tsx:12-17` decide la
  sección activa por la URL, no por permisos.
