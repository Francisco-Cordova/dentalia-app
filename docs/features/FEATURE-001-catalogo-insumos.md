# FEATURE-001 · Catálogo de insumos

## Estado
DONE

## Objetivo
Consultar el catálogo de insumos del sistema de origen (Supabase/PostgreSQL) dentro del panel
Dentalia, con listado paginado, búsqueda por nombre y por código, y tolerancia a cortes de
conexión.

## Requirement relacionado
- RF-INS-001, RF-INS-002, RF-INS-003, RF-INS-004, RF-INS-005

## Reglas de negocio
- BR-INS-001, BR-INS-002, BR-INS-003, BR-INS-004, BR-INS-005, BR-INS-006

## Actor
Administrador autenticado.

## Permisos
- `insumos:read`

## Flujo
1. El usuario autenticado navega a `route('insumos')`.
2. El controller pagina `dev."Insumos"` en bloques de 10, ordenados por `ID`.
3. Aplica `ILike` escapado sobre `NAME` y/o `DEFAULT_CODE` según los query params.
4. Devuelve filas planas + `total`, `page`, `lastPage` y los filtros aplicados.
5. La página muestra la tabla, el total, el costo como moneda y la paginación.
6. Escribir en un buscador y pulsar Enter navega con los filtros; cambiar de página los conserva.

## Datos involucrados
- `dev."Insumos"` (esquema `dev`, lectura). ~5,060 filas, columnas en mayúsculas.
- Mapeo a la vista: `NAME → nombre`, `DEFAULT_CODE → codigo`, `MARCA → categoria`,
  `CANTIDAD → cantidad`, `UNIT_COST → costo`.

## API
- `GET /insumos` — Inertia (`inertia.render('insumos', …)`).
- Query params: `page`, `nombre`, `codigo`.

## UX/UI
- Página: `inertia/pages/insumos.tsx`.
- Estilos: `inertia/css/app.css` (`.skus-page`, `.insumos-toolbar`, `.sku-table`, `.sku-pagination`).
- Referencia de diseño: no existe HTML de origen en `Plantillas/` para esta pantalla (brecha).

## Criterios de aceptación
- [x] AC-INS-001 · El listado trae datos reales del catálogo con total correcto (~5,060).
- [x] AC-INS-002 · La búsqueda por nombre ignora mayúsculas (`acrilico` = `AcRiLiCo`).
- [x] AC-INS-003 · La búsqueda por código ignora mayúsculas (`o0679` = `O0679`).
- [x] AC-INS-004 · Los comodines `%` y `_` se buscan literalmente.
- [x] AC-INS-005 · Los filtros se conservan al cambiar de página.
- [x] AC-INS-006 · Una búsqueda sin resultados renderiza vacío sin error.
- [x] AC-INS-007 · La consulta sobrevive a un corte de conexión y reintenta una vez.
- [x] AC-INS-008 · El catálogo se lee desde el schema `dev`.
- [x] AC-INS-009 · No existe ninguna ruta que escriba en el catálogo.
- [x] AC-INS-010 · La búsqueda se dispara con Enter (el form no tiene botón submit).
- [x] AC-INS-011 · Los dos buscadores se muestran en fila, no apilados.

## Casos límite
- Búsqueda por el identificador numérico: el campo rotulado "ID" filtra `DEFAULT_CODE`.
- Página fuera de rango: devuelve la página vacía con su número.
- `%` y `_` en el término: se escapan antes del `ILIKE`.
- Texto vacío: no se aplica filtro.
- Conexión inactiva caída por el servidor: pool + keepalive + un reintento.

## Pruebas esperadas
### Unitarias
- `escapeLike()` escapa `%` y `_`.
- El mapeo del modelo expone las 6 columnas con los nombres de la vista.

### Integración
- `InsumosController.index` devuelve `total`, `page`, `lastPage` y aplica los filtros.
- `withConnectionRetry()` reintenta una vez ante un error de conexión simulado.

### E2E
- Abrir `/insumos`, buscar, paginar y comprobar el total.
- Tras `pg_terminate_backend` de la conexión de la app, `/insumos` sigue respondiendo 200.

## Dependencias
- Proyecto Supabase con la tabla `dev."Insumos"`.
- `SUPABASE_DB_URL` en `.env` (con contraseña incluida).
- Driver `pg`.

## Riesgos
- **Inactividad**: Supabase corta conexiones ociosas → mitigado con `keepAlive`, pool
  `idleTimeoutMillis` 30 s y un reintento.
- **Cadena de conexión mal formada**: sin `:PASSWORD` falla el driver SASL al abrir conexión.
- **Esquema duplicado**: existe `public."Insumos"` con el mismo contenido; el orden del
  `searchPath` decide cuál se lee.
- **Coste por consulta**: cada visita ejecuta conteo + página (2 consultas).
- **Sin caché**: aceptable a ~5,060 filas, cuestionable si el catálogo crece un orden de magnitud.

## Ready for Development
- [x] Requirement definido.
- [x] Reglas de negocio identificadas.
- [x] Impacto en datos definido (solo lectura).
- [x] API definida (ruta Inertia `GET /insumos`).
- [x] Permisos definidos (`insumos:read`).
- [x] UX/UI disponible.
- [x] Criterios de aceptación verificables.
- [x] Dependencias y riesgos visibles.
- [x] Decisiones bloqueantes resueltas (ADR-001, ADR-003, ADR-004).

## Definition of Done
- [x] Implementación completa.
- [x] Pruebas aprobadas (smoke manual: búsqueda, mayúsculas, paginación, recuperación por corte).
- [ ] Code Review aprobado — **no formalizado**: no hay proceso de review en el repositorio. La
      revisión hecha fue documental y de código (esta tanda), no una aprobación trazable.
- [ ] CI aprobado — **no disponible: el proyecto no tiene CI** (brecha).
- [x] API/BD/docs actualizados (`01-requirements`, `02-functional-design`, `AGENTS.md`).
- [ ] QA/UAT completado — **no aplica: no hay ambiente de pruebas**.

## Evidencia
- Commits: `34ac808` (pantalla), `2278659` (integración con Supabase y buscadores),
  `5b4f99b` (reconexión tras pérdida de sesión con la BD).
- Archivos: `app/models/insumo.ts`, `app/controllers/insumos_controller.ts`,
  `app/services/with_connection_retry.ts`, `inertia/pages/insumos.tsx`, `config/database.ts`.
- Verificaciones: `npm run lint` y `npm run typecheck` sin errores; `GET /insumos` con sesión
  devuelve 200 con las 10 filas de la página 1.
- El total ~5,060 **quedó verificado** el 2026-09-30 con
  `SELECT count(*) FROM dev."Insumos"` → 5,060. `public."Insumos"` también tiene 5,060.

## Brechas
- `Ordenar` y "Última actualización" son estáticos en la UI pese a existir `modified_at`.
- Sin detalle por insumo (una sola fila de la tabla).
- Sin exportación.
- `Plantillas/` no tiene el HTML de referencia de esta pantalla.
- Sin cobertura automatizada: los criterios se validan con scripts de humo descartables.
