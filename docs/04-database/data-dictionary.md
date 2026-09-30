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

Persona con sesión. La crea el seeder de pruebas o `POST /signup`.

| Columna | Tipo SQLite | Nulo | Clave | Origen | Descripción |
|---|---|---|---|---|---|
| `id` | `integer` autoincrement | no | PK | Lucid | Identificador |
| `full_name` | `varchar(255)` | **sí** | — | Formulario | Nombre mostrado en el sidebar; si es null, la UI usa el correo |
| `email` | `varchar(254)` | no | **UNIQUE** (`users_email_unique`) | Formulario | Identificador de acceso; límite de 254 por RFC 5321 |
| `password` | `varchar(255)` | no | — | Mixin `withAuthFinder(hash)` | Hash scrypt. **Obligatorio** aunque el login real sea por magic link |
| `created_at` | `datetime` | no | — | Lucid | Alta |
| `updated_at` | `datetime` | sí | — | Lucid | Última modificación |

- `initials` (`app/models/user.ts:7-13`) no es columna: ACCESSOR que toma la primera letra de nombre
  y apellido, o las dos primeras del correo.
- Relación: `magic_links.user_id → users.id`.

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

## Esquemas del catálogo no modelados

`SKUs`, `Familias`, `Kit de insumos`, `Usuarios`, `Zonas`, `Módulos de salud` **no tienen modelo
Lucid**: sus pantallas son maquetas con `{}` como props. No se documenta aquí lo que no se conoce
desde el código.

---

## Diagrama

Ver [er-diagram.md](er-diagram.md).

## Referencias
- [Diseño de base de datos](database-design.md)
- [Estrategia de migraciones](migration-strategy.md)
- `database/migrations/`, `database/schema.ts` (generado), `app/models/`
