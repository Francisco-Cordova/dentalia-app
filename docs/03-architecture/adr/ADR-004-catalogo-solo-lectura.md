# ADR-004 · Catálogo de Supabase de solo lectura

- Estado: Accepted
- Fecha: 2026-09-30
- Decisores: Dev owner

## Contexto
El catálogo de insumos (~5,060 filas) está alojado en Supabase y **se administra fuera de este
repositorio** (otro equipo o proceso). La aplicación solo necesita listar y filtrar; no crea ni
modifica insumos.

Supabase corta las conexiones PostgreSQL ociosas. SinEdd Measures, la primera consulta tras varios
minutos de inactividad fallaba con `connection terminated unexpectedly`, lo que rompía el
panel en `/insumos`.

## Opciones consideradas

### Opción A · Lectura directa a Supabase + Tolerancia a cortes
- Ventajas:
  - Datos frescos sin paso de sincronización ni duplicación.
  - Una sola fuente de verdad.
  - Coste de escritura cero en la aplicación.
- Desventajas:
  - Fragilidad ante cortes de conexión: hay que configurar keepAlive, pool y reintento.
  - Latencia de red en cada carga de `/insumos`.

### Opción B · Copiar el catálogo a SQLite/Postgres propio
- Ventajas: sin red en tiempo de ejecución; cortes irrelevantes; más rápido.
- Desventajas:
  - Duplica ~5,060 filas y exige un proceso de sincronización (cron, webhook) que no existe.
  - Riesgo de divergencia y de datos obsoletos.
  - Contradice el requisito de que Supabase es la fuente de verdad.

### Opción C · Usar PostgREST (vía `@supabase/supabase-js`)
- Ventajas: el servicio gestiona el pool y los cortes.
- Desventajas: segunda vía de datos (ver [ADR-001](ADR-001-driver-postgres-lucid.md)); formato de
  respuesta menos expresivo.

## Decisión
**Opción A** con tres medidas concretas:
1. `keepAlive: true` + `keepAliveInitialDelayMillis: 30_000` en la conexión `pg`.
2. Pool con `max: 5`, `idleTimeoutMillis: 30_000` para reciclar antes de que el servidor corte.
3. `withConnectionRetry()` reintenta **una vez** toda consulta al catálogo ante error de conexión.

Y `migrations.paths: []` en la conexión `supabase` para impedir migraciones accidentales. Ninguna
consulta escribe en la conexión del catálogo.

## Consecuencias

### Positivas
- `/insumos` sobrevive a minutos de inactividad (verificado con un smoke de ~3 min).
- El catálogo nunca se modifica desde la aplicación.
- Corrección consolidada en el commit `5b4f99b`.

### Negativas / trade-offs
- Cada visita depende de la red y paga el coste de la conexión.
- La primera consulta tras un corte **ya puede** fallar: el reintento es de una sola oportunidad
  (si también falla, el error sube).
- Opciones que el tipo de Lucid no declara (`keepAlive`, `pool`) viven en un `const` aparte
  (`supabaseConnection`), susceptible de desincronizarse con el driver.

## Revisión
Si `/insumos` se convierte en la pantalla caliente o el corte resulta ser un problema recurrente,
migrar a Opción B con un proceso de sincronización, o a Opción C para delegar el pool.

## Referencias
- [base de datos](../../04-database/database-design.md)
- [app/services/with_connection_retry.ts](../../../app/services/with_connection_retry.ts)
- [config/database.ts](../../../config/database.ts)
