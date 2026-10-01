# Diseño de base de datos

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Motores

| Conexión | Motor | Esquema | Proprietario | Modo | Uso |
|---|---|---|---|---|---|
| `sqlite` (default) | SQLite 3 (better-sqlite3) | `main` | Dev owner | **Lectura/Escritura** | `users`, `magic_links` |
| `supabase` | PostgreSQL (proyecto Supabase, vía `pg`) | `dev` (con fallback `public`) | Otro equipo | **Solo lectura** | `dev."Insumos"` (~5,060 filas), `dev."Kits"` (40), `dev."zonas"` (2) |

La sesión **no está en la base de datos**: `SESSION_DRIVER=cookie` (`.env`), por lo que el estado
de sesión viaja en una cookie cifrada y no hay tabla `sessions`.

El motor real de cada conexión está en `config/database.ts`. SQLite se elige porque auth es
escritura ligera y en DEV no debe depender de red (ver [ADR-003](../03-architecture/adr/ADR-003-dos-conexiones-search-path.md)).
El catálogo vive en PostgreSQL porque ya existe allí y no se replica (ver
[ADR-004](../03-architecture/adr/ADR-004-catalogo-solo-lectura.md)).

## Convenciones

- **Auth (SQLite)**: tablas en minúsculas y snake_case (`magic_links`). Claves `id` enteras
  autoincrementales (`integer ... primary key autoincrement`). Timestamps de Lucid
  (`created_at`, `updated_at`) y columnas de negocio con sufijo `_at`.
- **Tokens**: `magic_links.token_hash` es un SHA-256 en hex de 64 caracteres
  (`createHash('sha256').update(token).digest('hex')`). El token en claro **solo** existe en el
  correo y en la URL; en la tabla nunca se guarda en claro.
- **Contraseñas**: `users.password` es `NOT NULL` y se hashea por el mixin
  `withAuthFinder(hash)` de `@adonisjs/auth` (scrypt por defecto en AdonisJS 7). El hash se
  recalcula en `User.create()` / `verifyCredentials()`, nunca explícitamente.
- **Catálogo (Supabase)**: esquema preexistente, tabla y columnas con **comillas y mayúsculas**
  (`"Insumos"`, `NAME`, `DEFAULT_CODE`, `MARCA`, `CANTIDAD`, `UNIT_COST`). No se renombra ni migra:
  el modelo Lucid lo mapea a minúsculas (`nombre`, `codigo`, `categoria`, `cantidad`, `costo`) para
  la UI.
- **No hay migraciones para Supabase**: la conexión declara `migrations.paths: []`.

## Entidades principales

| Entidad | Conexión | Responsabilidad |
|---|---|---|
| `users` | sqlite | Persona con sesión. Solo email, nombre opcional y hash de contraseña. Creada por el seeder o por `POST /signup` |
| `magic_links` | sqlite | Token de un solo uso hasheado, ligado a `user_id`, con expiración (30 min) y `used_at` |
| `dev."Insumos"` | supabase | Catálogo de insumos del proveedor: nombre, código, marca, cantidad y costo |
| `dev."Kits"` | supabase | Catálogo de kits: nombre, código de Odoo, costo, descripción y la lista de insumos que lo componen |
| `dev."zonas"` | supabase | Catálogo de zonas: nombre y descripción. `costo` existe pero la app no lo expone |
| `public.clinicas_zonas` | supabase | Relación zona↔clínica (`clinica_id`, `zona_id`): la app la cuenta para la columna "Clínicas" |
| `adonis_schema` / `adonis_schema_versions` | sqlite | Contabilidad interna de migraciones (Lucid). No es dominio |

## Relaciones y cardinalidad

- No hay **integridad referencial entre motores**: SQLite no sabe de Supabase y viceversa.
- `magic_links.user_id → users.id` con **`ON DELETE CASCADE`**: borrar un usuario invalida sus
  enlaces pendientes. Es la única FK de la aplicación.
- `magic_links` **no** guarda el correo: se llega al usuario por la relación. Por eso un correo no
  registrado no genera fila (el flujo corta antes de crear el enlace).
- `dev."Insumos"` es una entidad **independiente** sin FKs a otras tablas de la aplicación.
- `dev."Kits"` también es independiente: **no hay FK entre `Kits` e `Insumos`**. La relación se
  codifica dentro del propio texto de `"Insumos"`, como una lista de `DEFAULT_CODE` separados por
  coma. Consecuencia: no se puede validar en la base que un código exista, ni saber la cantidad de
  cada insumo. El resto del catálogo —SKUs, familias— **no está modelado todavía**.
- `public."Kits"` es una tabla distinta de `dev."Kits"`: una fila por par kit×insumo, con
  `id_kit`, `id_insumo`, `Cantidad requerida numero`, `Costo unitario` y `Usos`. Contiene la
  información de detalle que `dev."Kits"` no tiene. La aplicación no la consulta todavía.
- `dev."zonas"` (2 filas, `id` 1 y 2) se lee para el catálogo de zonas. `public."zonas"` es un
  **duplicado exacto** (mismas columnas y filas), no una tabla de detalle como `public."Kits"`.
- `public.clinicas_zonas` (13 filas) es la única tabla del catálogo con **FKs reales** verificadas:
  `clinica_id → public."clinicas".id` y `zona_id → public."zonas".id`. La app la cuenta por
  `zona_id` para armar la columna "Clínicas" de `/zonas`; no escribe en ella.

## Constraints (verificadas contra `tmp/db.sqlite3`)

| Tabla | Constraint | Origen |
|---|---|---|
| `users.email` | `NOT NULL` + `UNIQUE` (índice `users_email_unique`) | migración `1761885935168` |
| `users.full_name` | `NULLABLE` | migración |
| `users.password` | `NOT NULL` | migración |
| `magic_links.user_id` | `NULLABLE` + FK a `users.id` `ON DELETE CASCADE` | migración `1761885935169` |
| `magic_links.token_hash` | `NOT NULL` + `UNIQUE` (índice `magic_links_token_hash_unique`) | migración |
| `magic_links.expires_at` | `NOT NULL` | migración |
| `magic_links.used_at` | `NULLABLE` (`NULL` = vigente) | migración |

Las migraciones en `database/migrations` son la fuente ejecutable; el `DDL` real se confirmó
inspeccionando `sqlite_master`. `magic_links.user_id` es nullable en el esquema aunque la
aplicación siempre lo escribe (hereda el default de Lucid para belongsTo opcional).

## Índices

| Tabla | Índice | Motivo |
|---|---|---|
| `users` | `users_email_unique (email)` | Integridad y `findBy('email')` en cada login |
| `magic_links` | `magic_links_token_hash_unique (token_hash)` | Lookup por token en cada verificación; además garantiza unicidad del hash |
| `magic_links` | **ninguno en `user_id` ni `expires_at`** | Baja corrección: el volumen de enlaces pendientes es de decenas. La limpieza de expirados tendría que recorrer la tabla |
| `supabase` | índices del propietario, fuera de este repositorio | La búsqueda `ILIKE '%término%'` con wildcard inicial hace seq scan: ningún índice B-tree ayuda |

## Soft delete

Ninguna tabla usa soft delete. La baja de un `user` es un `DELETE`; los tokens expirados se
consideran inservibles por `expires_at` (no se purgan: ver Brechas).

## Migraciones

- **SQLite (auth)**: `database/migrations/*.ts` — se ejecutan con `node ace migration:run`
  (conexión default `sqlite`).
- **Supabase (catálogo)**: `migrations.paths: []`. **Nunca** ejecutar
  `node ace migration:run --connection=supabase`. El esquema de `dev."Insumos"` ya existe en
  Supabase y su ciclo de vida es externo.

## Session store

La sesión se guarda en una **cookie cifrada y firmada** con `APP_KEY`
(`SESSION_DRIVER=cookie`, `.env` → `config/session.ts:59`). No hay store en servidor:

| Store declarado | ¿En uso? |
|---|---|
| `cookie` (`stores.cookie()`) | **Sí**: es el valor de `SESSION_DRIVER` |
| `database` (`stores.database()`) | No. Requeriría una tabla `sessions` que **no existe**; activarlo fallaría |

Consecuencias: la sesión **sobrevive a reinicios** del servidor (no hay estado en disco) y queda
limitada por el tamaño de la cookie (~4 KB), por lo que los flash y props de sesión deben ser
pequeños.

## Riesgos/volumen

- **Autenticación (SQLite)**: volumen bajo (decenas de usuarios, un enlace por login). Crecimiento
  en `magic_links` por cada solicitud de enlace.
- **Catálogo (Supabase)**: ~5,060 filas estáticas. Cada visita a `/insumos` ejecuta 2 consultas
  (conteo + página). El `ILIKE '%…%'` hace un seq scan; aceptable a este volumen, se vuelve
  costoso a escala.
- La sesión en cookie sobrevive a reinicios, pero depende de que `APP_KEY` no cambie: rotarlo
  invalida todas las sesiones abiertas (ver [secrets-management](../06-security/secrets-management.md)).

## Brechas

- **No hay purga de `magic_links`**: los tokens usados y expirados se acumulan sin limpieza
  (no hay worker ni job) y sin índice que lo haga barato.
- **`magic_links.user_id` es nullable**: el esquema lo permite aunque la aplicación siempre lo
  escriba. Nada impide un enlace huérfano por inserción directa.
- **Los esquemas restantes del catálogo no están modelados** (SKUs, familias, usuarios de
  negocio, módulos de salud): solo existen `dev."Insumos"`, `dev."Kits"` y `dev."zonas"`
  (con `public.clinicas_zonas` para el conteo de clínicas).
- **No hay réplicas ni caché**: cada lectura va a la fuente primaria (ver [ADR-004](../03-architecture/adr/ADR-004-catalogo-solo-lectura.md)).
- El store `database` de sesión está declarado en `config/session.ts` pero **no es funcional**
  (falta la tabla `sessions`): un cambio de `SESSION_DRIVER` a `database` rompería el arranque.
- Sin particionado ni retención; no es necesario al volumen actual.
- El conteo de 5,060 filas de `dev."Insumos"`, 40 de `dev."Kits"`, 2 de `dev."zonas"` y 13 de
  `public.clinicas_zonas` quedó **verificado** el 2026-09-30 con `SELECT count(*)`.

## Referencias
- [Diccionario de datos](data-dictionary.md)
- [Diagrama ER](er-diagram.md)
- [Estrategia de migraciones](migration-strategy.md)
- [Respaldo y recuperación](backup-recovery.md)
