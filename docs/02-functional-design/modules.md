# Módulos

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-10-01 |
| Versión relacionada | 2278659, 5b4f99b |

El sistema tiene hoy siete módulos de dominio. Cada uno corresponde a un grupo de archivos real;
las fronteras son observables en el código.

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
- Gestión de usuarios (alta, edición, baja) — la pantalla `/usuarios` solo **lista** las cuentas que
  ya pueden entrar.
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
- SKU y familias: son pantallas maqueta sin conexión a datos.
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

## Catálogo de kits (`KIT`)

**Objetivo:** listar los kits del catálogo con paginación, búsqueda por nombre e identificador,
el conteo de insumos que los componen y su costo.

**Responsabilidades**
- Leer `dev."Kits"` de Supabase en bloques de 10, ordenados por `id`.
- Calcular el conteo de insumos a partir de la columna `"Insumos"`, que es una lista de códigos
  separados por coma y no un número (`app/controllers/kits_controller.ts`).
- Presentar el costo como moneda y el identificador con prefijo `#`.
- Presentar la tabla, los buscadores y la paginación (`inertia/pages/kits.tsx`).

**No es responsable de**
- Escrituras: el modal "Nuevo kit" y el botón de acciones son maqueta, no hay ruta que escriba.
- El detalle de los insumos de un kit: no existe todavía la tabla de relación.
- La fecha de "última actualización", que sigue estática.

**Dependencias**
- Las mismas que el catálogo de insumos: conexión `supabase`, `withConnectionRetry()`.

**Archivos**

| Archivo | Rol |
|---|---|
| `app/models/kit.ts` | Modelo Lucid sobre `supabase."Kits"` |
| `app/controllers/kits_controller.ts` | Filtros `nombre`/`codigo`, conteo de insumos, paginación y render |
| `inertia/pages/kits.tsx` | Tabla, buscadores, paginación, modal maqueta |

---

## Catálogo de zonas (`ZON`)

**Objetivo:** listar las zonas del catálogo con paginación, búsqueda por nombre y el conteo de
clínicas asignadas a cada zona.

**Responsabilidades**
- Leer `dev."zonas"` de Supabase en bloques de 10, ordenados por `id` ascendente.
- Calcular el conteo de clínicas por zona con una subconsulta correlacionada sobre
  `public.clinicas_zonas` (`app/controllers/zonas_controller.ts`), no con un join que rompería
  el conteo del paginador.
- Presentar el `id` bajo el nombre sin prefijo `#` (a diferencia de kits, aquí no hay código de
  Odoo).
- Presentar la tabla, el buscador y la paginación (`inertia/pages/zonas.tsx`).

**No es responsable de**
- Escrituras: el modal "Nueva zona" y el botón de acciones son maqueta, no hay ruta que escriba.
- La asignación de clínicas a zonas: `public.clinicas_zonas` se lee, pero nadie escribe desde
  la app.
- Mostrar `costo`: existe en la tabla pero no se expone (es `NULL` en las 2 filas actuales y
  no aparece en la referencia de diseño).

**Dependencias**
- Las mismas que el catálogo de insumos: conexión `supabase`, `withConnectionRetry()`.

**Archivos**

| Archivo | Rol |
|---|---|
| `app/models/zona.ts` | Modelo Lucid sobre `supabase."zonas"` (sin `costo` a propósito) |
| `app/controllers/zonas_controller.ts` | Filtro `nombre`, subconsulta de clínicas, paginación y render |
| `inertia/pages/zonas.tsx` | Tabla, buscador, paginación, modal maqueta |

---

## SKUs (`SKU`)

**Objetivo:** listar los SKUs del catálogo con paginación y tres buscadores (nombre, ID de
tratamiento, ID de SKU).

**Responsabilidades**
- Leer `dev."SKU"` de Supabase en bloques de 10, ordenados por `id` ascendente (`id` disperso entre
  8 y 287).
- Filtrar por `"Nombre"`, `"ID tratamiento"` (con cast a texto, ver más abajo) y `"ID SKU"`, los tres
  combinables e independientes (`app/controllers/skus_controller.ts`).
- Presentar las **7 columnas de la maqueta** (`inertia/pages/skus.tsx`). Solo `Nombre` lleva dato
  real, con el subtexto `Tratamiento {ID tratamiento} · SKU {ID SKU}`.
- Mostrar como **dato dummy declarado** las 4 celdas sin origen: `Tipo` (`TIPO_DUMMY`),
  `Estatus` (`ESTATUS_DUMMY`) y `Familia`, `Especialidad`, `Módulo de salud` (`SIN_DATO_DUMMY`).
- Presentar la tabla, los 3 buscadores y la paginación real (26 páginas sobre 255 filas).

**No es responsable de**
- Escrituras: `Nuevo SKU`, `Edición masiva` y `Ordenar` son maqueta, no hay ruta que escriba.
- Detalle: la acción por fila (`externalLink`) no abre nada porque no hay ruta de detalle.
- La información financiera del SKU (precios, comisiones, márgenes), que existe en la tabla con 25
  columnas y no se muestra.
- El conteo de insumos y de kits por SKU, que se podría calcular con `public."Insumos_SKU"`
  (1,904 filas) y `public.kit_sku` (1,179 filas).
- "Última actualización": el texto del pie es dummy aunque `created_at` exista.

**Detalle técnico**
- El filtro de `"ID tratamiento"` **requiere cast**: `"ID tratamiento"` es `bigint` y PostgreSQL no
  castea `bigint` a texto implícitamente, así que un `ILIKE` directo falla con
  `operator does not exist: bigint ~~* unknown`. Con `"ID tratamiento"::text` se habilita la
  coincidencia parcial (`500` encuentra el `5004`).
- `"ID SKU"` es texto tipo `'2.3'` y **no es único** (253 distintos en 255 filas): un mismo
  filtro puede devolver varias filas.
- `public."SKU"` comparte los 255 `id` pero **no es duplicado exacto**: difieren ~210 filas en las
  columnas de costo y margen. El `searchPath` pone `dev` primero y esa es la fuente documentada.

**Dependencias**
- Las mismas que el catálogo de insumos: conexión `supabase`, `withConnectionRetry()`.

**Archivos**

| Archivo | Rol |
|---|---|
| `app/models/sku.ts` | Modelo Lucid sobre `supabase."SKU"` (solo 4 de las 25 columnas) |
| `app/controllers/skus_controller.ts` | Filtros `nombre`/`tratamiento`/`codigo`, paginación y render |
| `inertia/pages/skus.tsx` | Tabla de 7 columnas, 3 buscadores, paginación, constantes dummy |

---

## Módulos de salud (`MSD`)

**Objetivo:** listar los módulos de salud del catálogo con paginación y búsqueda por nombre.

**Responsabilidades**
- Leer `dev.modulos_salud` de Supabase en bloques de 10, ordenados por `id` ascendente.
- Presentar la tabla con las 3 columnas de la referencia de diseño: `Nombre` (con la descripción
  como subtexto), `SKU` y `Opciones` (botón trash) (`inertia/pages/modulos_de_salud.tsx`).
- Mostrar **0 como dato dummy** en la columna "SKU" (`SKUS_DUMMY` en la página).

**No es responsable de**
- **Contar los SKUs de cada módulo**: no es derivable, `public."SKU"` no tiene columna ni FK hacia
  módulos. Es lo que la referencia muestra bajo "SKU".
- Escrituras: el modal "Nuevo módulo de salud" y el botón trash son maqueta, no hay ruta que
  escriba ni que borre.
- Mostrar `id_modulo` ni `updated_at`: no aparecen en la referencia y no se declaran en el modelo.

**Dependencias**
- Las mismas que el catálogo de insumos: conexión `supabase`, `withConnectionRetry()`.

**Archivos**

| Archivo | Rol |
|---|---|
| `app/models/modulos_salud.ts` | Modelo Lucid sobre `supabase.modulos_salud` (sin `id_modulo` ni `updated_at` a propósito) |
| `app/controllers/modulos_salud_controller.ts` | Filtro `nombre`, paginación y render |
| `inertia/pages/modulos_de_salud.tsx` | Tabla de 3 columnas, buscador, paginación, modal maqueta |

---

## Usuarios (`USR`)

**Objetivo:** listar las cuentas que existen en el sistema, que son exactamente las que pueden
autenticarse con magic link.

**Responsabilidades**
- Consultar `users` en SQLite con filtro por nombre o correo, paginación y orden por `id`
  (`app/controllers/usuarios_controller.ts`).
- Exponer solo los campos que la referencia muestra: `full_name`, `email`, `area`, `rol`,
  `superadmin`.
- Presentar la tabla, el buscador y la paginación (`inertia/pages/usuarios.tsx`).

**No es responsable de**
- Crear, editar ni dar de baja cuentas: el modal "Nuevo usuario" y el menú `···` son maqueta, no hay
  ruta que escriba. Quien llega al sistema por magic link tiene que existir de antemano.
- Autorización: `area`, `rol` y `superadmin` son **datos de pantalla**. Nada en el servidor los lee;
  el acceso sigue siendo binario (`middleware.auth()`).
- Mostrar `password`: la columna existe y es `NOT NULL`, pero no se selecciona.

**Dependencias**
- **SQLite**, no Supabase: es el único catálogo que lee la conexión de autenticación, y por eso no
  usa `withConnectionRetry()` (ese reintento existe para cortes del pool de `pg`).
- La migración `1780000000000_add_area_rol_superadmin_to_users_table` añade `area`, `rol` y
  `superadmin`; sin ellas no se podrían mostrar las columnas de la referencia.

**Archivos**

| Archivo | Rol |
|---|---|
| `app/models/user.ts` | Modelo Lucid de autenticación que también sirve de catálogo (con `area`, `rol`, `superadmin` declarados a propósito) |
| `app/controllers/usuarios_controller.ts` | Filtro `q` (nombre o correo), paginación y render |
| `inertia/pages/usuarios.tsx` | Tabla de 5 columnas, buscador, paginación, modal maqueta |
| `database/migrations/1780000000000_add_area_rol_superadmin_to_users_table.ts` | Añade las tres columnas de pantalla |

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

- **No existe módulo de autorización**: `roles-permissions`, policies y abilities están vacíos; el
  control de acceso es binario. Tener columnas `rol` y `superadmin` no cuenta como autorización.
- **No existe módulo de catálogo para el resto del dominio**: familias vive como página que importa
  un array hardcodeado y necesitará su módulo al pasar a datos reales. SKUs ya tiene el suyo.
- Los catálogos de insumos, SKUs, kits, zonas y módulos de salud comparten forma y conexión, pero
  están duplicados como módulos independientes; no hay una abstracción común de catálogo.
  `/usuarios` se suma a esa lista con una diferencia: lee otra conexión (SQLite) y comparte el
  modelo con la autenticación.
- **No existe módulo de API**: `providers/api_provider.ts` y el registro de Tuyau están montados, pero ninguna ruta devuelve JSON.
- Los límites entre módulos se apoyan en convención (rutas en `start/routes.ts`, alias `#models/*`, `#services/*`) y no en una capa de dominio o casos de uso.
