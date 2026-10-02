# Diccionario de datos

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

Dos conjuntos de datos en motores distintos. El de auth se administra aquí (Lucid + migraciones);
el del catálogo se administra fuera del repositorio.

---

# 1. SQLite — autenticación

## `users`

Persona con sesión. La crea el seeder de pruebas o `POST /signup`. Es también la fuente del
catálogo de `/usuarios`, que se lee de esta misma tabla.

| Columna | Tipo SQLite | Nulo | Clave | Origen | Descripción |
|---|---|---|---|---|---|
| `id` | `integer` autoincrement | no | PK | Lucid | Identificador |
| `full_name` | `varchar(255)` | **sí** | - | Formulario | Nombre mostrado en el sidebar y en la columna "Nombre"; si es null, la UI usa el correo |
| `email` | `varchar(254)` | no | **UNIQUE** (`users_email_unique`) | Formulario | Identificador de acceso; límite de 254 por RFC 5321. Columna "Correo" del catálogo |
| `password` | `varchar(255)` | no | - | Mixin `withAuthFinder(hash)` | Hash scrypt. **Obligatorio** aunque el login real sea por magic link. **Nunca se expone en `/usuarios`** |
| `area` | `varchar(255)` | **sí** | - | **Migración 2026-10-01** | Columna "Area" del catálogo. Dato de pantalla, no autoriza nada |
| `rol` | `varchar(255)` | **sí** | - | **Migración 2026-10-01** | Columna "Rol". Texto libre porque la referencia trae valores compuestos (`"Validador, Editar"`). Dato de pantalla |
| `superadmin` | `boolean` | no | - | **Migración 2026-10-01**, default `false` | Columna "Superadmin" (Sí/No). En la referencia es una columna separada del rol. Dato de pantalla |
| `created_at` | `datetime` | no | - | Lucid | Alta |
| `updated_at` | `datetime` | **sí** | - | Lucid | Última modificación |

- `initials` (`app/models/user.ts`) no es columna: ACCESSOR que toma la primera letra de nombre
  y apellido, o las dos primeras del correo.
- Relación: `magic_links.user_id → users.id`.
- **Última actualización**: 2026-10-01. `area`, `rol` y `superadmin` las añade la migración
  `1780000000000_add_area_rol_superadmin_to_users_table`, porque sin ellas el catálogo no podía
  mostrar las columnas de la referencia de diseño. Ninguna de las tres participa en una decisión de
  autorización: `middleware.auth()` sigue siendo el único control.
- Contenido verificado el 2026-10-01: **1 fila** (`id 1`, `area = 'TO'`, `rol = 'Superadmin'`,
  `superadmin = 1`). Se borraron 17 usuarios de prueba que habían dejado scripts de humo
  (`verify-*`, `dbg-*`, `smoke@*`). Ese archivo es local y gitignored, así que la limpieza hay que
  repetirla en cualquier otro entorno.

## `magic_links`

Enlace de acceso de un solo uso. Solo guarda el **hash** del token.

| Columna | Tipo SQLite | Nulo | Clave | Origen | Descripción |
|---|---|---|---|---|---|
| `id` | `integer` autoincrement | no | PK | Lucid | Identificador |
| `user_id` | `integer` | **sí** | FK → `users.id` `ON DELETE CASCADE` | `User.findBy(...)` | Usuario destinatario |
| `token_hash` | `varchar(64)` | no | **UNIQUE** (`magic_links_token_hash_unique`) | `sha256(token)` | Hash SHA-256 en hex del token en claro |
| `expires_at` | `datetime` | no | — | `now + 30 min` | Vigencia (`TOKEN_TTL_MINUTES = 30`) |
| `used_at` | `datetime` | **sí** | — | Al verificar | `NULL` = vigente. Su escritura hace el enlace de un solo uso |
| `created_at` | `datetime` | no | — | Lucid | Emisión |
| `updated_at` | `datetime` | sí | — | Lucid | Última modificación |

**No existe columna `email` ni `token` en claro.** El correo se alcanza por la relación con
`users`, y el token en claro solo viaja en el correo y en la URL.

## `adonis_schema` / `adonis_schema_versions`

Contabilidad de migraciones de Lucid (`name`, `batch`, `migration_time` / `version`). No son
datos de dominio.

---

# 2. PostgreSQL (Supabase) — catálogo

## `dev."Insumos"`

~5,060 filas (cifra de `AGENTS.md`, no reverificada). Solo lectura. El modelo
`app/models/insumo.ts` declara solo las 6 columnas que la UI consume; el resto existe en la tabla
pero **no se selecciona**.

| Columna real | Tipo (PostgreSQL) | Expuesta como | Tipo TS | Uso |
|---|---|---|---|---|
| `ID` | numérico | `id` | `number` | PK, orden asc, clave de React |
| `NAME` | texto | `nombre` | `string` | Columna "Nombre"; filtrable con `ILIKE` |
| `DEFAULT_CODE` | texto | `codigo` | `string` | Subtítulo de la celda; **búsqueda "ID"** |
| `MARCA` | texto | `categoria` | `string` | Columna "Categoria" |
| `CANTIDAD` | numérico | `cantidad` | `number` | Columna "Cantidad"; la UI tolera string |
| `UNIT_COST` | numérico | `costo` | `number` | Columna "Costo"; la UI formatea `$X.XX` |
| `modified_at` | timestamp | — | — | **Existe pero no se usa**: "Última actualización" es texto fijo en la UI |

## Mapeo de búsqueda

| Campo de UI | Consulta | Query param |
|---|---|---|
| Buscar **Nombre** | `WHERE NAME ILIKE '%término%'` | `nombre` |
| Buscar **ID** | `WHERE DEFAULT_CODE ILIKE '%término%'` | `codigo` |

Ambos escapan `%` y `_` con `escapeLike()` (`app/controllers/insumos_controller.ts:5-7`) para que
el usuario pueda buscar literalmente esos caracteres.

## `dev."Kits"`

Ver [FEATURE-005](../features/FEATURE-005-kits-de-insumos.md): 40 filas, columnas en mayúsculas con
tilde (`"Nombre"`, `"ID_odoo"`, `"Costo"`, `"Descripcion"`, `"Insumos"`), `id` disperso entre 7 y
136. El modelo `app/models/kit.ts` mapea a `nombre`, `codigo`, `costo`, `descripcion`,
`insumosRaw`. La columna `"Insumos"` es una lista de `DEFAULT_CODE` separados por coma, no un
número: la tabla muestra el conteo, que calcula el controller.

## `dev."zonas"`

2 filas, columnas en **minúsculas**. El modelo `app/models/zona.ts` mapea a `id`, `nombre`,
`descripcion`, `createdAt`.

| Columna real | Tipo (PostgreSQL) | Expuesta como | Tipo TS | Uso |
|---|---|---|---|---|
| `id` | `bigint` | `id` | `number` | PK, orden asc, clave de React; se muestra bajo el nombre **sin** prefijo `#` |
| `nombre` | `text` | `nombre` | `string` | Columna "Nombre"; filtrable con `ILIKE` |
| `descripcion` | `text` | `descripcion` | `string \| null` | Leída por el modelo, no mostrada |
| `costo` | `real` | — | — | **Existe pero no se expone**: `NULL` en las 2 filas y no aparece en la referencia de diseño |
| `created_at` | `timestamptz` | `createdAt` | `Date` | No usada por la UI |

`public."zonas"` es un **duplicado exacto** (mismas columnas, mismas 2 filas, verificado con
`EXCEPT` en ambos sentidos). El `searchPath` pone `dev` primero, así que se lee `dev."zonas"`.

### Mapeo de búsqueda

| Campo de UI | Consulta | Query param |
|---|---|---|
| Buscar **Nombre** | `WHERE nombre ILIKE '%término%'` | `nombre` |

Un solo buscador (decidido por el usuario), que escapa `%` y `_`.

## `public.clinicas_zonas`

13 filas. Tabla de relación zona↔clínica; la app **solo la cuenta** para la columna "Clínicas" de
`/zonas`, con una subconsulta correlacionada (no un join, que rompería el conteo del paginador).

| Columna | Tipo (PostgreSQL) | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `clinica_id` | `bigint` | no | FK → `public."clinicas".id` | Clínica asignada |
| `zona_id` | `bigint` | no | FK → `public."zonas".id` | Zona de la clínica |
| `created_at` | `timestamptz` | sí | — | Alta de la relación |

Conteo verificado el 2026-09-30: zona 1 (`Turista`) → 7 clínicas, zona 2 (`Nacional`) → 6. Sin
duplicados ni huérfanos. La app no escribe en esta tabla.

## `dev.modulos_salud`

10 filas, `id` 1 a 10 (contiguos). Tabla y columnas en **minúsculas**, como `dev."zonas"`. Se lee
para el catálogo de módulos de salud; `public.modulos_salud` es un **duplicado exacto** (mismas 6
columnas y mismas 10 filas, verificado con `EXCEPT` en ambos sentidos).

| Columna | Tipo (PostgreSQL) | Nulo | Clave | Mapeo a la app | Descripción |
|---|---|---|---|---|---|
| `id` | `bigint` | no | PK | `id` | Clave del modelo |
| `nombre` | `text` | no | — | `nombre` | Especialidad (PERIODONCIA, ORTODONCIA…) |
| `descripcion` | `text` | sí | — | `descripcion` | Se muestra como subtexto bajo el nombre |
| `created_at` | `timestamptz` | no | — | `createdAt` | **No se muestra** en la vista |
| `updated_at` | `timestamptz` | no | — | — | **No se declara en el modelo**: esta pantalla no tiene columna "Última actualización" |
| `id_modulo` | `bigint` | no | — | — | **No se declara en el modelo**: identificador de otro origen, desconocido. No coincide con `id` (fila `id` 1 → `id_modulo` 13; fila `id` 8 → 1) |

### Mapeo de búsqueda
- El buscador único de `/modulos-de-salud` filtra por `nombre` con `ilike` y `%`/`_` escapados
  (`escapeLike()`).
- Orden ascendente por `id`.

### La columna "SKU" no sale de aquí
La referencia de diseño muestra el número de SKUs de cada módulo bajo la cabecera "SKU". **Ese dato
no es derivable**: `dev.modulos_salud` no tiene FKs que entren ni salgan (verificado en
`information_schema`), y `public."SKU"` (255 filas) no tiene ninguna columna ni FK que referencie
un módulo. La pantalla muestra `0` como dato dummy, declarado como constante `SKUS_DUMMY` en
`inertia/pages/modulos_de_salud.tsx`.

## Esquemas del catálogo no modelados

`SKUs`, `Familias` y `Usuarios` **no tienen modelo Lucid**: sus pantallas son
maquetas con `{}` como props. No se documenta aquí lo que no se conoce desde el código.

---

## Diagrama

Ver [er-diagram.md](er-diagram.md).

## Referencias
- [Diseño de base de datos](database-design.md)
- [Estrategia de migraciones](migration-strategy.md)
- `database/migrations/`, `database/schema.ts` (generado), `app/models/`
