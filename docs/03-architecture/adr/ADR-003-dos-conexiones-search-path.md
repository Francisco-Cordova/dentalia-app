# ADR-003 · Dos conexiones y `searchPath: ['dev', 'public']`

- Estado: Accepted
- Fecha: 2026-09-30
- Decisores: Dev owner

## Contexto
La aplicación tiene dos necesidades con requisitos opuestos:

1. **Sesión y credenciales**: escritura frecuente (crear `users`, `magic_links`, rotar cookies). AdonisJS/Lucid
   ofrece drivers SQLite para desarrollo local sin servidor externo.
2. **Catálogo de insumos**: lectura de ~5,060 filas ya alojadas en Supabase (PostgreSQL), cuyo
   esquema vive fuera de este repositorio y no debe modificarse.

Además, en Supabase la tabla se llama `"Insumos"` (con comillas por mayúscula) y existe en el
esquema `dev`, no en `public`.

## Opciones consideradas

### Opción A · Dos conexiones: `sqlite` (default) para auth, `supabase` para catálogo
- Ventajas:
  - `db()` por defecto sigue siendo trivial y no toca la red en el login.
  - Migraciones de auth con tooling estándar de AdonisJS.
  - El catálogo externo queda aislado: ni el esquema ni los datos se mezclan.
- Desventajas:
  - Dos motores y dos lecturas en el arranque de cada worker de auth.
  - La configuración de `searchPath` es propia de la conexión `supabase` (knex la ejecuta al conectar).

### Opción B · Todo en Supabase (incluido auth)
- Ventajas: un solo motor y un solo esquema.
- Desventajas:
  - Obliga a que las migraciones de auth corran contra un esquema propiedad de otro equipo
    (`migrations.paths: []` está prohibido justamente para no escribirlos).
  - Perder la red de Supabase dispara el login, no solo el catálogo.
  - El DEV pasa a depender de red externa.

### Opción C · Todo en SQLite (incluido catálogo)
- Ventajas: cero red, DEV totalmente local.
- Desventajas: obligaría a replicar ~5,060 filas y su esquema en un archivo, duplicando la
  fuente de verdad. Inaceptable.

## Decisión
**Opción A**: conexión `sqlite` como default para auth y `supabase` (PostgreSQL) como conexión
secundaria **de solo lectura** para el catálogo. El modelo `Insumo` fija
`static connection = 'supabase'`; los modelos `User` y `MagicLink` usan la default.

Sobre el nombre de la tabla: en vez de `static schema = 'dev'`, se configura
`searchPath: ['dev', 'public']` en la conexión `supabase`. Knex ejecuta
`set search_path to 'dev','public'` en cada conexión nueva.

## Consecuencias

### Positivas
- `Insumo` se consulta con `db().queryFrom('Insumo')` sin schema explícito: la búsqueda con
  `ILIKE` y el orden por `ID` funcionan directamente.
- El DEV puede levantar el panel (salvo el catálogo) sin red.
- Aislamiento: ningún modelo de auth alcanza la conexión `supabase`.

### Negativas / trade-offs
- `searchPath` **oculta el esquema**: una tabla homónima en `public` se resolvería antes que en `dev`
  si cambiara el orden. Requiere disciplina.
- El driver `pg` requiere extensiones de Node (instaladas aparte) que SQLite no necesita.
- El DEV depende de la red para `/insumos`.

## Revisión
- Si el catálogo dejara de ser solo lectura, reevaluar Opción B o mover las migraciones de auth a un
  esquema propio.
- Si una tabla futura viviera en otro esquema, quitar el fallback `public` o usar `static schema`.

## Referencias
- [conexiones y búsqueda](../../04-database/database-design.md)
- [config/database.ts](../../../config/database.ts)
- [ADR-004](ADR-004-catalogo-solo-lectura.md)
