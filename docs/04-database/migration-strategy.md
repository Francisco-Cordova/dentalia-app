# Estrategia de migraciones

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Dos universos de migración

| Universo | Motor | Origen de verdad | Herramienta |
|---|---|---|---|
| **Auth** | SQLite (`sqlite`, default) | `database/migrations/*.ts` versionado | `node ace migration:run` |
| **Catálogo** | PostgreSQL (Supabase) | **Fuera de este repositorio** | Ninguna: `migrations.paths: []` |

## Regla dura

```bash
# NUNCA en la conexión del catálogo:
node ace migration:run --connection=supabase
```

`config/database.ts` declara `supabase.migrations.paths: []` justamente para que esto no sea
posible. Las tablas del catálogo ya existen y su ciclo de vida es de otro equipo.

## Migraciones de auth existentes

| Archivo | Contenido |
|---|---|
| `1761885935168_create_users_table.ts` | `users` con `full_name` nullable, `email` unique, `password` not null |
| `1761885935169_create_magic_links_table.ts` | `magic_links` con FK a `users` en cascada, `token_hash` unique, `expires_at`, `used_at` nullable |

Comandos:

```bash
node ace migration:run     # aplica las pendientes (sqlite)
node ace migration:status  # ver estado
node ace db:seed           # crea el usuario de pruebas del magic link
```

El `DDL` resultante se verificó contra `sqlite_master` y coincide con los archivos de migración.

## `database/schema.ts` es generado

`database/schema.ts` contiene `MagicLinkSchema` y `UserSchema`: son clases base generadas por
Lucid a partir del esquema real. **No se edita a mano**; se regenera con el codegen. Los modelos
de `app/models/` extienden esas clases (`compose(UserSchema, withAuthFinder(hash))`).

Consecuencia: un cambio de esquema exige (1) migración, (2) codegen, (3) actualizar los modelos si
aparecen columnas nuevas.

## Seeds

`database/seeders/add_magic_link_test_user_seeder.ts` crea un usuario de pruebas
(`francisco.cordova@konfront.mx`) con contraseña temporal, para poder pedir un magic link en DEV.
Es la vía prevista para dar de alta usuarios, ya que el enlace por correo **no** los crea.

## Brechas

- **No hay migraciones de rollback probadas**: los archivos incluyen `down()`, pero no hay evidencia
  de que se hayan ejecutado nunca. Antes de tocar auth en un ambiente compartido, ejecutar
  `migration:rollback` en una copia.
- **No hay migraciones para el catálogo**, por diseño. Cualquier cambio de esquema en `dev."Insumos"`
  debe coordinarse con el equipo propietario y no se refleja en este repositorio.
- **`database/schema.ts` generado y versionado** puede desincronizarse si alguien edita la base de
  datos a mano sin regenerar: el typecheck seguiría en verde con columnas inexistentes.
- No hay migraciones para índices del catálogo (depende de los del propietario).
- El store `database` de sesión (`stores.database()`) **no tiene migración**: activarlo fallaría.

## Referencias
- [Diseño de base de datos](database-design.md)
- [Diccionario de datos](data-dictionary.md)
- `config/database.ts`, `database/migrations/`, `database/schema.ts`
