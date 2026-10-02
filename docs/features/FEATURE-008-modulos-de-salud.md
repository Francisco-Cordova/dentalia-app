# FEATURE-008 · Módulos de salud

## Estado
DONE

Los AC ya estaban cerrados y `Pruebas aprobadas` marcado desde la implementación; el `READY` había
quedado desactualizado. Se corrigió el 2026-10-02 al revisar los estados junto con FEATURE-003.

## Objetivo
Consultar el catálogo de módulos de salud del sistema de origen (Supabase/PostgreSQL) dentro del
panel Dentalia, con listado paginado y búsqueda por nombre, con tolerancia a cortes de conexión.
La columna "SKU" queda con dato dummy hasta que exista forma de contar los SKUs de cada módulo.

## Requirement relacionado
- RF-MSD-001, RF-MSD-002, RF-MSD-003

## Reglas de negocio
- BR-MSD-001, BR-MSD-002, BR-MSD-003, BR-MSD-004, BR-MSD-005

## Actor
Administrador autenticado.

## Permisos
- `modulos:read`

## Flujo
1. El usuario autenticado navega a `route('modulosDeSalud')`.
2. El controller pagina `dev.modulos_salud` en bloques de 10, ordenados por `id` ascendente.
3. Aplica `ILike` escapado sobre `nombre` según el query param.
4. Devuelve filas planas + `total`, `page`, `lastPage` y el filtro aplicado.
5. La página muestra la tabla con las 3 columnas de la referencia (Nombre, SKU, Opciones) y la
   paginación.
6. Escribir en el buscador y pulsar Enter navega con el filtro; cambiar de página lo conserva.

## Datos involucrados
- `dev.modulos_salud` (esquema `dev`, lectura). **10 filas** (`id` 1 a 10, contiguos). Tabla y
  columnas en **minúsculas**: `id`, `nombre`, `descripcion`, `created_at`, `updated_at`,
  `id_modulo`.
- Mapeo a la vista: `id → id`, `nombre → nombre`, `descripcion → descripcion`, `created_at →
  createdAt`.
- **`id_modulo` (`bigint`, `NOT NULL`) no se declara en el modelo**: no es el `id`, no coincide con
  él (fila `id` 1 → `id_modulo` 13, fila `id` 8 → `id_modulo` 1) y no aparece en la pantalla ni en
  la referencia de diseño. Se documenta aquí como identificador externo de origen desconocido.
- **`updated_at` tampoco se declara**: no hay columna "Última actualización" en esta pantalla.
- `public.modulos_salud` **es un duplicado exacto** de `dev.modulos_salud` (mismas 6 columnas,
  mismas 10 filas, verificado con `EXCEPT` en ambos sentidos). El `searchPath` pone `dev` primero.
- **No hay FKs** que apunten a esta tabla ni que salgan de ella (verificado en
  `information_schema`): es una tabla huérfana en el modelo relacional.
- **La columna "SKU" de la pantalla no se puede calcular todavía.** `public."SKU"` tiene 255 filas
  pero **ninguna columna ni FK que referencie un módulo**, así que no hay forma de contar cuántos
  SKUs pertenecen a cada módulo de salud. `public.especialidades` está vacía (0 filas).

### Contenido verificado el 2026-10-01
| `id` | nombre | `id_modulo` |
|---|---|---|
| 1 | SIN ASIGNAR | 13 |
| 2 | PERIODONCIA | 6 |
| 3 | ORTODONCIA | 5 |
| 4 | RESTAURATIVO BASICO | 9 |
| 5 | ENDODONCIAS | 3 |
| 6 | PROCEDIMIENTOS QUIRURGICOS MENORES | 8 |
| 7 | PROCEDIMIENTOS QUIRURGICOS MAYORES | 7 |
| 8 | CORONAS / PROSTODONCIA | 1 |
| 9 | DIAGNOSTICO Y PREVENCION | 2 |
| 10 | ESTETICO | 4 |

En las 10 filas `descripcion` viene con el mismo texto que `nombre`, y `created_at` es
`2026-04-27T17:29:10.049Z` en todas.

## API
- `GET /modulos-de-salud` — Inertia (`inertia.render('modulos_de_salud', …)`).
- Query params: `page`, `nombre`.

## UX/UI
- Página: `inertia/pages/modulos_de_salud.tsx`.
- Estilos: `inertia/css/app.css` (`.skus-page`, `.skus-toolbar`, `.sku-table`, `.sku-pagination`).
- Referencia de diseño: `Plantillas/modulos de salud/Dentalia catalogo digital.html`.
- **Columnas según la referencia: `Nombre` | `SKU` | `Opciones`** (3 columnas). La referencia
  muestra el número de SKUs bajo la cabecera "SKU" y el botón de acción (trash) bajo "Opciones";
  la maqueta anterior de esta pantalla tenía 4 columnas con el número desplazado a "Opciones" y
  una "Acciones" extra, lo cual no coincide con el HTML.
- El modal "Nuevo módulo de salud" y el botón trash siguen siendo maqueta: no hay escritura.

## Criterios de aceptación
- [x] AC-MSD-001 · El listado trae datos reales del catálogo con total correcto (10).
- [x] AC-MSD-002 · La búsqueda por nombre ignora mayúsculas (`periodoncia` encuentra `PERIODONCIA`).
- [x] AC-MSD-003 · Los comodines `%` y `_` se buscan literalmente (devuelven 0, no 10).
- [x] AC-MSD-004 · El filtro se conserva al cambiar de página.
- [x] AC-MSD-005 · Una búsqueda sin resultados renderiza vacío sin error.
- [x] AC-MSD-006 · El orden es ascendente por `id` (`SIN ASIGNAR` id 1 va antes que `ESTETICO`
      id 10).
- [x] AC-MSD-007 · La tabla tiene 3 columnas (`Nombre`, `SKU`, `Opciones`) como la referencia.
- [x] AC-MSD-008 · La columna "SKU" muestra `0` en todas las filas (dato dummy declarado, no real).
- [x] AC-MSD-009 · La consulta se ejecuta dentro de `withConnectionRetry()` (tolerancia a corte).

### Evidencia de verificación (2026-10-01)

Smoke HTTP autenticado contra `GET /modulos-de-salud` (18 checks, todos en verde):
`total=10`, `lastPage=1`, los 10 nombres reales del catálogo en orden `id` asc, `descripcion`
real, búsqueda `periodoncia` → 1 y `QUIRURGICOS` → 2, `%` y `_` → 0 resultados, `page=99` →
vacía conservando el número, filtro+página combinados, y las props limitadas a
`id,nombre,descripcion` (sin `id_modulo`, `updated_at` ni `sku`).

AC-MSD-007 y AC-MSD-008 los verificó el usuario en el navegador (2026-10-01), que es la única
vía: esta app **no tiene SSR**, así que el HTML servido es el shell más el `data-page` y el
markup de la tabla lo monta React en el cliente. Confirmó las 3 columnas `Nombre`, `SKU`,
`Opciones` y el `0` en las 10 celdas de la columna SKU. Con esto los 9 AC quedan cerrados.

## Casos límite
- Hay exactamente 10 filas y el `perPage` es 10: una sola página, pie `1-10 de 10`. La paginación
  queda funcional para cuando Odoo cargue más módulos.
- Página fuera de rango: devuelve la página vacía con su número.
- `%` y `_` en el término: se escapan antes del `ILIKE`.
- Texto vacío: no se aplica filtro.
- `descripcion` es nullable aunque hoy las 10 filas la traigan: si viene `NULL`, la página no
  pinta el subtexto bajo el nombre.
- Conexión inactiva caída por el servidor: pool + keepalive + un reintento.

## Pruebas esperadas
### Unitarias
- `escapeLike()` escapa `%` y `_`.

### Integración
- `ModulosSaludController.index` devuelve `total`, `page`, `lastPage` y aplica el filtro `nombre`.

### E2E
- Abrir `/modulos-de-salud`, buscar, paginar y comprobar el total (10), el orden y los nombres.

## Dependencias
- Proyecto Supabase con `dev.modulos_salud`.
- `SUPABASE_DB_URL` en `.env` (con contraseña incluida).
- Driver `pg`.

## Riesgos
- **Inactividad**: Supabase corta conexiones ociosas → mitigado con `keepAlive`, pool
  `idleTimeoutMillis` 30 s y un reintento.
- **Dato dummy en producción**: la columna "SKU" muestra `0` en todas las filas. Si alguien lo
  lee como dato real, el conteo es falso. Mitigación: el valor está declarado en el frontend como
  constante y esta regla (BR-MSD-002) está documentada; en cuanto exista la relación SKU↔módulo se
  sustituye por el conteo real.
- **Esquema duplicado**: `public.modulos_salud` es un duplicado real. Si alguien invierte el
  `searchPath`, leería las mismas 10 filas, así que el riesgo es bajo.
- **Concepto sin 정의 de negocio**: "módulo de salud" y "opciones" siguen sin definición oficial
  (ver `docs/01-requirements/modulos-pendientes.md`). Se implementa la lectura del catálogo, no la
  semántica.

## Ready for Development
- [x] Requirement definido.
- [x] Reglas de negocio identificadas.
- [x] Impacto en datos definido (solo lectura).
- [x] API definida (ruta Inertia `GET /modulos-de-salud`).
- [x] Permisos definidos (`modulos:read`).
- [x] UX/UI disponible (`Plantillas/modulos de salud/`).
- [x] Criterios de aceptación verificables.
- [x] Dependencias y riesgos visibles.
- [x] Decisiones bloqueantes resueltas.

### Decisiones bloqueantes resueltas en esta sesión
- **Alcance**: solo lectura del catálogo. El modal "Nuevo módulo de salud" y el botón trash
  siguen de maqueta; no se insertan módulos.
- **Columnas**: 3 columnas siguiendo el HTML de referencia (`Nombre`, `SKU`, `Opciones`,
  decido por el usuario). Se descarta la maqueta de 4 columnas que existía en la pantalla.
- **Dato de SKUs**: no es derivable (`public."SKU"` no tiene columna ni FK hacia módulos), así que
  se muestra **0 en todas las filas** como dato dummy (decidido por el usuario).
- **Buscador**: uno solo, filtra por `nombre` (mismo patrón que zonas). No se busca por `id`.
- **Orden**: ascendente por `id` (mismo criterio que insumos, kits y zonas).
- **Paginación**: `perPage` 10, igual que el resto de catálogos, aunque hoy haya una sola página
  (decidido por el usuario: dejarla preparada para cuando Odoo cargue más módulos).

## Definition of Done
- [x] Implementación completa.
- [x] Pruebas aprobadas (smoke HTTP autenticado sobre `GET /modulos-de-salud`: 18 checks en
      verde, más revisión manual del usuario en el navegador para las columnas y el dato dummy).
- [ ] Code Review aprobado - **no formalizado**: no hay proceso de review en el repositorio.
- [ ] CI aprobado - **no disponible: el proyecto no tiene CI** (brecha).
- [x] API/BD/docs actualizados (`01-requirements`, `02-functional-design`, `03-architecture`,
      `04-database`, `05-api`, `08-quality`, `features/`, `docs/README.md` y `AGENTS.md`).
- [ ] QA/UAT completado - **no aplica: no hay ambiente de pruebas**.

## Brechas
- El modal "Nuevo módulo de salud" y el botón trash son maqueta, sin escritura.
- La columna "SKU" muestra un dummy; falta la relación que permita contar SKUs por módulo.
- `descripcion` y `created_at` se leen en el modelo pero no se muestran en la vista.
- Solo hay 10 módulos; la paginación no se ejercita más allá de la página 1 con datos reales.
- Sin cobertura automatizada: los criterios se validan con scripts de humo descartables.
