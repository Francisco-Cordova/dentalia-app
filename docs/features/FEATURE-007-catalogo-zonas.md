# FEATURE-007 · Catálogo de zonas

## Estado
DONE

Los AC ya estaban cerrados y `Pruebas aprobadas` marcado desde la implementación; el `READY` había
quedado desactualizado. Se corrigió el 2026-10-02 al revisar los estados junto con FEATURE-003.

## Objetivo
Consultar el catálogo de zonas del sistema de origen (Supabase/PostgreSQL) dentro del panel
Dentalia, con listado paginado, búsqueda por nombre y el conteo de clínicas asignadas a cada
zona, con tolerancia a cortes de conexión.

## Requirement relacionado
- RF-ZON-001, RF-ZON-002, RF-ZON-003

## Reglas de negocio
- BR-ZON-001, BR-ZON-002, BR-ZON-003, BR-ZON-004, BR-ZON-005

## Actor
Administrador autenticado.

## Permisos
- `zonas:read`

## Flujo
1. El usuario autenticado navega a `route('zonas')`.
2. El controller pagina `dev."zonas"` en bloques de 10, ordenados por `id` ascendente.
3. Aplica `ILike` escapado sobre `nombre` según el query param.
4. Calcula el conteo de clínicas de cada zona con una subconsulta correlacionada sobre
   `public.clinicas_zonas` (mismo `zona_id`).
5. Devuelve filas planas + `total`, `page`, `lastPage` y el filtro aplicado.
6. La página muestra la tabla (nombre, `id` bajo el nombre sin `#`, conteo de clínicas) y la
   paginación.
7. Escribir en el buscador y pulsar Enter navega con el filtro; cambiar de página lo conserva.

## Datos involucrados
- `dev."zonas"` (esquema `dev`, lectura). **2 filas** (`id` 1 y 2, contiguos). Tabla y columnas
  en **minúsculas**: `id`, `nombre`, `descripcion`, `costo`, `created_at`, `updated_at`.
- Mapeo a la vista: `id → id`, `nombre → nombre`, `descripcion → descripcion`, `created_at →
  createdAt`.
- **`costo` existe (`real`) pero no se declara en el modelo a propósito**: las 2 filas lo traen en
  `NULL` y la columna no aparece en la pantalla. No es un descuido.
- `public."zonas"` **es un duplicado exacto** de `dev."zonas"` (mismas columnas, mismas 2 filas,
  verificado con `EXCEPT` en ambos sentidos). A diferencia de `public."Kits"`, que es tabla de
  detalle, este no aporta nada que `dev` no tenga. El `searchPath` pone `dev` primero.
- **`public."clinicas_zonas"`** es la tabla de relación zona↔clínica: `clinica_id`, `zona_id`,
  `created_at`, 13 filas, con FKs reales a `public."clinicas".id` y `public."zonas".id`. Sin
  duplicados ni huérfanos. La columna "Clínicas" de la tabla **no está** en `dev."zonas"`: sale
  de contar estas filas.

### Conteo verificado el 2026-09-30
| `zona_id` | nombre | clínicas |
|---|---|---|
| 1 | Turista | 7 |
| 2 | Nacional | 6 |

## API
- `GET /zonas` — Inertia (`inertia.render('zonas', …)`).
- Query params: `page`, `nombre`.

## UX/UI
- Página: `inertia/pages/zonas.tsx`.
- Estilos: `inertia/css/app.css` (`.skus-page`, `.skus-toolbar`, `.sku-table`, `.sku-pagination`).
- Referencia de diseño: `Plantillas/zonas/Dentalia catalogo digital.html`.
- El modal "Nueva zona" y el botón de acciones (`···`) siguen siendo maqueta: no hay escritura.
- **No hay columna "Costo" ni "Última actualización"** en la referencia de zonas; el `id` va bajo
  el nombre **sin** prefijo `#` (a diferencia de kits, aquí no hay código de Odoo).

## Criterios de aceptación
- [x] AC-ZON-001 · El listado trae datos reales del catálogo con total correcto (2).
- [x] AC-ZON-002 · La búsqueda por nombre ignora mayúsculas (`nac` encuentra `Nacional`).
- [x] AC-ZON-003 · Los comodines `%` y `_` se buscan literalmente (devuelven 0, no 2).
- [x] AC-ZON-004 · El filtro se conserva al cambiar de página.
- [x] AC-ZON-005 · Una búsqueda sin resultados renderiza vacío sin error.
- [x] AC-ZON-006 · El conteo de clínicas es correcto (`Turista` → 7, `Nacional` → 6), calculado
      desde `public.clinicas_zonas`.
- [x] AC-ZON-007 · El orden es ascendente por `id` (`Turista` id 1 va antes que `Nacional` id 2).
- [x] AC-ZON-008 · El `id` se muestra bajo el nombre sin prefijo `#`.
- [x] AC-ZON-009 · La columna `costo` no aparece en la UI, aunque exista en la tabla.
- [x] AC-ZON-010 · La consulta se ejecuta dentro de `withConnectionRetry()` (tolerancia a corte).

## Casos límite
- Solo hay 2 zonas y el `perPage` es 10: una sola página, pie `1-2 de 2`. La paginación queda
  funcional para cuando Odoo cargue más zonas.
- Página fuera de rango: devuelve la página vacía con su número.
- `%` y `_` en el término: se escapan antes del `ILIKE`.
- Texto vacío: no se aplica filtro.
- Conexión inactiva caída por el servidor: pool + keepalive + un reintento.

## Pruebas esperadas
### Unitarias
- `escapeLike()` escapa `%` y `_`.

### Integración
- `ZonasController.index` devuelve `total`, `page`, `lastPage` y aplica el filtro `nombre`.
- El conteo de clínicas por zona usa la subconsulta correlacionada (no un join que rompa el
  `count` del paginador).

### E2E
- Abrir `/zonas`, buscar, paginar y comprobar el total (2), el orden (`Turista`, `Nacional`) y
  los conteos de clínicas (7 y 6).

## Dependencias
- Proyecto Supabase con `dev."zonas"` y `public.clinicas_zonas`.
- `SUPABASE_DB_URL` en `.env` (con contraseña incluida).
- Driver `pg`.

## Riesgos
- **Inactividad**: Supabase corta conexiones ociosas → mitigado con `keepAlive`, pool
  `idleTimeoutMillis` 30 s y un reintento.
- **Esquema duplicado**: `public."zonas"` es un duplicado real (a diferencia de
  `public."Kits"`). Si alguien invierte el `searchPath`, leería las mismas 2 filas, así que el
  riesgo es bajo; la diferencia real sería futura: si Odoo escribe en uno solo.
- **Coste por consulta**: cada visita ejecuta conteo + página (2 consultas), y la página además
  evalúa la subconsulta correlacionada por fila. Aceptable a 2 filas.
- **Sin caché**: aceptable a 2 filas.

## Ready for Development
- [x] Requirement definido.
- [x] Reglas de negocio identificadas.
- [x] Impacto en datos definido (solo lectura).
- [x] API definida (ruta Inertia `GET /zonas`).
- [x] Permisos definidos (`zonas:read`).
- [x] UX/UI disponible (`Plantillas/zonas/`).
- [x] Criterios de aceptación verificables.
- [x] Dependencias y riesgos visibles.
- [x] Decisiones bloqueantes resueltas.

### Decisiones bloqueantes resueltas en esta sesión
- **Alcance**: solo lectura del catálogo. No se insertan zonas ni clínicas; eso es trabajo
  posterior.
- **Buscador**: uno solo, filtra por `nombre` (decidido por el usuario). No se busca por `id`.
- **Costo**: no se muestra en la pantalla (decidido por el usuario), aunque la columna exista y
  sea `NULL` en las 2 filas. Tampoco se declara en el modelo.
- **Conteo de clínicas**: subconsulta correlacionada en el `select`, no `join` + `groupBy`.
  Razón: `paginate()` hace `clone().clearSelect().count('* as total')`; con un join el conteo
  contaría filas de la unión y no zonas. Verificado leyendo
  `@adonisjs/lucid/build/src/orm/query_builder/index.js` (`paginate`).
- **Orden**: ascendente por `id` (decidido por el usuario). Con los datos actuales
  (`Turista` id 1, `Nacional` id 2) eso pone `Turista` primero, a diferencia del mock.
- **Paginación**: funcional aunque hoy solo haya 1 página (decidido por el usuario: dejarla
  preparada para cuando Odoo cargue más zonas).

## Definition of Done
- [x] Implementación completa.
- [x] Pruebas aprobadas (smoke HTTP autenticado sobre `GET /zonas`: total, paginación, búsqueda
      case-insensitive, comodines escapados, sin resultados, página fuera de rango, conteos de
      clínicas — 15 checks).
- [ ] Code Review aprobado — **no formalizado**: no hay proceso de review en el repositorio.
- [ ] CI aprobado — **no disponible: el proyecto no tiene CI** (brecha).
- [x] API/BD/docs actualizados (`01-requirements`, `02-functional-design`, `04-database`,
      `05-api`, `AGENTS.md`).
- [ ] QA/UAT completado — **no aplica: no hay ambiente de pruebas**.

## Evidencia
- Archivos: `app/models/zona.ts`, `app/controllers/zonas_controller.ts`,
  `inertia/pages/zonas.tsx`, `docs/02-functional-design/flows/FLOW-ZON-001.md`.
- Verificaciones: `node ace codegen`, `npm run lint` y `npm run typecheck` sin errores.
- Datos confirmados el 2026-09-30: `dev."zonas"` tiene 2 filas (`id` 1 y 2);
  `public."clinicas_zonas"` tiene 13 filas, sin duplicados ni huérfanos, y sus conteos por zona
  (7 y 6) coinciden con lo que muestra el HTML de referencia.
- Smoke HTTP autenticado el 2026-09-30 (15/15 checks): total 2, `Turista` 7 clínicas,
  `Nacional` 6, orden por `id`, `nac`/`NAC` encuentran `Nacional`, `%` y `_` devuelven 0,
  página 99 vacía, filtro + página combinados.

## Brechas
- El modal "Nueva zona" y el botón `···` son maqueta, sin escritura.
- `descripcion` y `created_at` se leen en el modelo pero no se muestran en la vista.
- Solo hay 2 zonas; la paginación no se ejercita más allá de la página 1 con datos reales.
- Sin cobertura automatizada: los criterios se validan con scripts de humo descartables.
