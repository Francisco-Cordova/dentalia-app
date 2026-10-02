# Roles de usuario

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2278659, 5b4f99b |

El sistema **no implementa RBAC**: no hay policies, ni abilities, ni tabla de permisos, ni ningún
código que lea un rol para decidir un acceso. El único control es binario: ¿hay sesión o no la hay?
Las filas siguientes describen los dos estados reales del código, no roles de negocio.

`users` tiene columnas `area`, `rol` y `superadmin` desde la migración
`1780000000000_add_area_rol_superadmin_to_users_table`, pero son **datos de pantalla**: existen para
que el catálogo de `/usuarios` pueda mostrar las columnas de la referencia, y nada las consulta para
autorizar. Que haya una columna `rol` no significa que haya un sistema de roles.

| Rol | Objetivo | Alcance de datos | Observaciones |
|---|---|---|---|
| `Administrador` | Operar el catálogo y la navegación del panel | Catálogo completo de insumos (solo lectura) y sus propios datos de sesión | Estado real de **cualquier** usuario autenticado. Sin diferenciación entre usuarios |
| `Visitante` | Acceder a la pantalla de login | Ninguno; solo puede solicitar un enlace de acceso | Usuario sin sesión. Es redirigido a `/skus` al iniciar sesión |
| `Autoregistrado` | Crear una cuenta desde `/signup` | El propio registro; hereda todos los permisos de `Administrador` | **Deuda de seguridad**: la ruta está en el grupo `guest`, no verifica el correo y autentica de inmediato |

## Cómo se determina el rol en el código

```
¿Existe sesión válida?
├── No  → Visitante: solo `/`, `/signup`, `POST /login/magic`, `GET /auth/magic/:token`
└── Sí  → Administrador: todas las rutas en `start/routes.ts:26-38`
```

- `middleware.auth()` (`app/middleware/auth_middleware.ts`) valida la sesión y, si falla, redirige
  a `/` conservando la URL pretendida.
- `middleware.guest()` (`app/middleware/guest_middleware.ts`) hace lo contrario: si hay sesión,
  expulsa al panel.
- `silent_auth_middleware` hidrata el usuario en páginas públicas para que el layout pueda
  mostrarlo sin proteger la ruta.

## Permisos derivados

| Recurso / acción | Visitante | Administrador |
|---|:---:|:---:|
| `sesion:create` (solicitar enlace) | Sí | Sí |
| `sesion:delete` (cerrar sesión) | No | Sí |
| `cuenta:create` (`POST /signup`) | Sí | No (redirigido) |
| `skus:read`, `familias:read`, `kits:read` | No | Sí |
| `insumos:read` | No | Sí |
| `usuarios:read`, `zonas:read`, `modulos:read` | No | Sí |
| `insumos:write`, `skus:write`, cualquier escritura | No | **No implementado** |

## Brechas

- **No hay separación de responsabilidades**: quien puede ver el catálogo puede ver también
  `/usuarios`, `/zonas` y `/modulos-de-salud`, porque las tres rutas comparten el mismo grupo con
  `middleware.auth()` y no aplican ningún filtro adicional.
- **No hay gestión de roles**: `inertia/pages/usuarios.tsx` ya lee `users` de verdad y muestra las
  columnas `Rol` y `Superadmin`, pero ambas son informativas. No hay ruta que las escriba, y el
  menú de editar/eliminar del catálogo es maqueta.
- **`/signup` es una puerta de entrada no deseada**: cualquier persona con un correo puede obtener
  una sesión con permisos de `Administrador`. Requiere verificación de correo o cierre de la ruta.
- **No hay auditoría de accesos**: no se registra quién consultó el catálogo ni qué usuario inició
  o cerró sesión (el único `logger` de la aplicación está en el envío del magic link).
- La matriz de permisos aprobada por negocio es un requisito pendiente: hasta que exista, este
  documento describe comportamiento técnico, no política de autorización.
