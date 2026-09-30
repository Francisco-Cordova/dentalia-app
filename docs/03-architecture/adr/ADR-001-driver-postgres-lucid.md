# ADR-001 · Conectar a Supabase con `pg` + Lucid en vez de supabase-js / PostgREST

- Estado: Accepted
- Fecha: 2026-09-30 (refleja la decisión tomada en el commit `2278659`)
- Decisores: Dev owner

## Contexto
El catálogo de insumos vive en Supabase (PostgreSQL) y hay que leerlo desde una aplicación
AdonisJS 7 con Lucid. Supabase ofrece dos caminos habituales: el SDK `supabase-js`
(habla con PostgREST y RPC) o un driver PostgreSQL nativo (`pg`), que se puede integrar con
Lucid como cualquier otra conexión.

## Opciones consideradas

### Opción A · `pg` + Lucid (conexión secundaria `supabase`)
- Ventajas:
  - Integración nativa con Lucid: modelos, migraciones, `paginate()`, scopes y typechecking.
  - Acceso a todo el poder de SQL (`ilike`, `orderBy`, agregados), no solo a las operaciones
    que expone PostgREST.
  - Un solo ORM en el proyecto (Lucid) y una sola forma de escribir consultas.
  - La lógica de negocio no queda atada al formato de respuesta de PostgREST.
- Desventajas:
  - Hay que gestionar la conexión TLS y el pool a mano (variables como `keepAlive` y `pool` no
    están declaradas en el tipo de Lucid y viven en un const aparte).
  - Supabase corta conexiones inactivas: exige `keepAlive`/pool y reintentos (ver
    [ADR-004](ADR-004-catalogo-solo-lectura.md) y `with_connection_retry.ts`).

### Opción B · `supabase-js` (PostgREST)
- Ventajas:
  - El pool y los cortes de conexión los gestiona el servicio.
  - SDK oficial, con tipado y filtros propios.
- Desventajas:
  - Fuera del ecosistema Lucid: una segunda vía de acceso a datos, otro tipado, otra capa que probar.
  - PostgREST impone su propio formato de respuesta y limita el SQL disponible.
  - Rompe la uniformidad del proyecto, donde todo lo demás ya usa Lucid.

## Decisión
**Opción A**: driver `pg` (instalado como dependencia) declarado como conexión Lucid secundaria
`supabase` en `config/database.ts`, leída solo por `Insumo` (`static connection = 'supabase'`).

## Consecuencias

### Positivas
- Una sola abstracción de datos en todo el proyecto (Lucid).
- Consultas SQL expresivas: la búsqueda con `ILIKE` y el orden por `ID` son triviales.
- La paginación (`paginate`) produce el total y la página de la misma fuente.

### Negativas / trade-offs
- La robustez de conexión es responsabilidad nuestra (keepalive, pool, reintento). El
  coste se pagó con el incidente de "connection terminated unexpectedly" y su corrección
  (`5b4f99b`).
- Un `const` con opciones que el tipo de Lucid no declara puede desincronizarse del driver si
  este cambia.

## Revisión
Reconsiderar si el catálogo deja de ser solo lectura, si se escriben en Supabase desde la
aplicación (entonces el SDK oficial empieza a aportar) o si el volumen exige réplicas/materialización.

## Referencias
- [integrations.md](../integrations.md)
- [config/database.ts](../../../config/database.ts)
