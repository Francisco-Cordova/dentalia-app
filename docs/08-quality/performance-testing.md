# Performance Testing

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Estado

**No se ha hecho ninguna prueba de performance.** No hay herramienta, no hay resultados históricos, no
hay objetivos definidos y no hay ambiente donde medirlos.

## Objetivos

| Métrica | Objetivo | Definido por |
|---|---|---|
| Concurrencia de usuarios | **Sin definir** | Nadie |
| Latencia p95 | **Sin definir** | Nadie |
| Throughput | **Sin definir** | Nadie |
| Tamaño de bundle del cliente | **Sin medir** | — |
| Duración de la consulta del catálogo | **Sin medir** | — |

No hay cifras que sirvan de línea base. Cualquier número que se documentara ahora sería inventado, y
por eso este documento no los incluye.

## Escenarios que habría que medir

| # | Escenario | Qué mide | Prioridad |
|---|---|---|---|
| 1 | `/insumos` sin filtros | Latencia de la página y de la consulta con ~5.060 filas paginadas a 10 | Alta |
| 2 | `/insumos` con `ilike %término%` sobre `NAME` y `DEFAULT_CODE` | Peor caso: `ilike` con comodín inicial no usa índice | **Muy alta** |
| 3 | Navegar a la última página (`page = lastPage`) | Coste del `count` y del `offset` alto | Alta |
| 4 | Sesión que expira tras 2 h de inactividad | Coste de la reautenticación | Baja |
| 5 | Carga del bundle del cliente (Vite) | First paint en la red real del cliente | Media |
| 6 | Muchos usuarios concurrentes leyendo el catálogo | Comportamiento del pool de `pg` y de Supabase ante cortes de conexión | Media |
| 7 | Muchos usuarios escribiendo `magic_links` al pedir enlaces | Crecimiento de la tabla (hoy sin purga) | Baja (volumen) / alta (operativo) |

## Riesgos conocidos que un test de performance revelaría

| Riesgo | Por qué |
|---|---|
| **`ilike '%término%'` no es indexable** | Con ~5.060 filas es aceptable hoy; el plan se vuelve secuencial. Crecer el catálogo lo convierte en un problema |
| **`withConnectionRetry()` puede duplicar una consulta** | Ante un corte, la consulta se reintenta: en lecturas es inocuo, pero duplicaría un INSERT de `magic_links` si se aplicara a escritura |
| **Pool pequeño + cortes frecuentes de Supabase** | `keepAlive` ayuda, pero los cortes del proveedor generan reintentos y latencia irregular |
| **`count(*)` en cada página** | `InsumosController` cuenta el total para `lastPage` en cada petición |
| **Sin caché de catálogo** | Cada visita a `/insumos` golpea Supabase |
| **Sin `margin` de bundle** | `docs/07-development` no fija presupuesto de tamaño |

## Cómo se mediría (no implementado)

| Tipo | Herramienta posible | Nota |
|---|---|---|
| Carga HTTP | `autocannon` o `k6` | Contra un DEV local no mide nada útil: no hay red real ni Supabase real |
| Consulta | `EXPLAIN ANALYZE` sobre `dev."Insumos"` | Es la forma más honesta aquí, y no necesita ambiente |
| Frontend | Lighthouse o `bundle` de Vite | El `npm run build` ya emite el tamaño del chunk |

Los tres se pueden hacer hoy sin instalar nada salvo autocannon, pero **no se han ejecutado**.

## Referencias
- [Integraciones](../03-architecture/integrations.md)
- [Catálogo de insumos](../features/FEATURE-001-catalogo-insumos.md)
- [Rendimiento de consultas de insumos](../04-database/database-design.md)

## Brechas

- **Sin objetivos de rendimiento**: nadie ha dicho cuál es la latencia aceptable ni cuántos usuarios
  se esperan. Sin eso, una medición no puede evaluarse.
- **Sin línea base**: no hay forma de saber si una modificación empeora el rendimiento.
- **No hay infraestructura para medir**: sin ambiente desplegado no hay carga real que simular.
- **La búsqueda del catálogo es el riesgo conocido principal** y no está medida.
- **Sin presupuesto de tamaño de bundle**: nada vigila el crecimiento del cliente.
