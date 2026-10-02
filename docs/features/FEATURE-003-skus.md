# FEATURE-003 · SKUs

## Estado
DONE

## Objetivo
Consultar el catálogo de SKUs del sistema de origen (Supabase/PostgreSQL) dentro del panel
Dentalia, con listado paginado y tres buscadores (nombre, ID de tratamiento, ID de SKU), con
tolerancia a cortes de conexión. Cinco de las siete columnas de la maqueta no son derivables de la
base de datos y quedan como dato dummy declarado en el frontend.

## Requirement relacionado
- RF-SKU-001, RF-SKU-002, RF-SKU-003, RF-SKU-004

## Reglas de negocio
- BR-SKU-001, BR-SKU-002, BR-SKU-003, BR-SKU-004, BR-SKU-005, BR-SKU-006, BR-SKU-007

## Actor
Administrador autenticado.

## Permisos
- `sku:read`

## Flujo
1. El usuario autenticado navega a `route('skus')`.
2. El controller pagina `dev."SKU"` en bloques de 10, ordenados por `id` ascendente.
3. Aplica `ILike` escapado sobre `"Nombre"`, `"ID tratamiento"::text` y `"ID SKU"` según los query
   params, de forma independiente y combinable.
4. Devuelve filas planas + `total`, `page`, `lastPage` y los tres filtros aplicados.
5. La página muestra la tabla con las 7 columnas de la maqueta y la paginación real.
6. Escribir en cualquier buscador y pulsar Enter navega conservando los otros dos filtros.

## Datos involucrados
- `dev."SKU"` (esquema `dev`, lectura). **255 filas**, `id` de 8 a 287 (disperso, como
  `dev."Kits"`). Tabla y columnas con **mayúsculas y espacios**.
- Columnas declaradas en el modelo (las únicas que la pantalla necesita):
  - `id` (`bigint`, PK `sku_pkey`) → `id`.
  - `"Nombre"` (`text`, admite `NULL` aunque hoy las 255 filas traen valor) → `nombre`.
  - `"ID tratamiento"` (`bigint`, `NOT NULL`, `UNIQUE` `sku_id_tratamiento_key`) → `tratamiento`.
  - `"ID SKU"` (`text`, admite `NULL` aunque hoy las 255 filas traen valor) → `codigo`.
- Las **21 columnas restantes no se declaran**: no aparecen en la pantalla (BR-SKU-001).
- Mapeo a la vista: subtexto `Tratamiento {tratamiento} · SKU {codigo}` bajo el nombre.

### Contenido verificado el 2026-10-02
| Dato | Valor |
|---|---|
| Filas | 255 |
| Rango de `id` | 8 a 287 (los `id` 1-7 no existen) |
| `"Nombre"` distintos | 255 |
| `"ID tratamiento"` distintos | 255 |
| `"ID SKU"` distintos | 253 (hay 2 repetidos) |
| Nulos en `Nombre`, `ID SKU`, `sesiones`, `created_at` | 0 filas con `NULL` (las 4 columnas lo admiten salvo `created_at`, que es `NOT NULL DEFAULT now()`) |
| `"Precio Nacional"` / `"Precio Turista"` | 17 `NULL`; solo **34 de 255 filas** con precio ≠ 0 (rango 0-51,800) |
| `"Pasa por lab"` | Texto sucio: `no` 127, `false` 71, `yes` 44, `NULL` 13 |
| `"Insumos"` | Lista de códigos separados por coma (igual que `dev."Kits"`), 14 `NULL`, un valor `"0"` |
| `created_at` | 2025-09-18 … 2026-09-28 |
| FKs de `dev."SKU"` | **Ninguna** |

### Diferencia entre `dev` y `public`
`public."SKU"` **existe** (255 filas) y **comparte los mismos 255 `id`**, pero **no es un
duplicado exacto**: `EXCEPT` en ambos sentidos devuelve 211 filas distintas. La diferencia está
**solo en las columnas de costo y margen**:

| Columna | Filas que difieren |
|---|---|
| `"Costo Nacional og"`, `"Costo Nacional espcialista"`, `"Costo Turista og"`, `"Costo Turista especialista"` | 210 |
| `"Costo insumos"` | 206 |
| `"Margen Nacional og"`, `"Margen Nacional especialista"`, `"Margen Turista og"`, `"Margen Turista especialista"` | 206 |
| `"Costo laboratorio"` | 1 |

Idénticos en ambos esquemas: `id`, `"Nombre"`, `"ID SKU"`, `"ID tratamiento"`, `created_at`,
`sesiones`, `"Sesion se paga"`, `"Insumos"`, `"Pasa por lab"`, los 4 `"Comision *"` y los 2
`"Precio *"`. Es decir: **la diferencia no afecta ninguna columna visible hoy**, pero documenta
que los costos se recalcularon en `dev`.

### Relaciones que no se usan (pero existen)
Dos tablas apuntan a `public."SKU"("ID tratamiento")` (BR-SKU-003):
- `public."Insumos_SKU"` — 1,904 filas, 150 SKUs con insumos. Podría dar el conteo de insumos
  por SKU con una subconsulta correlacionada (como la columna "Clínicas" de zonas). **No se
  usa**: la maqueta no tiene esa columna (decisión del usuario).
- `public."precios_comisiones` — 496 filas.
- `public.kit_sku` — 1,179 filas, 209 SKUs con kits. Tampoco se usa.

## API
- `GET /skus` — Inertia (`inertia.render('skus', …)`).
- Query params: `page`, `nombre`, `tratamiento`, `codigo`.

## UX/UI
- Página: `inertia/pages/skus.tsx`.
- Estilos: `inertia/css/app.css` (`.skus-page`, `.skus-toolbar`, `.sku-table`, `.sku-pagination`).
- **Referencia de diseño: NO existe `Plantillas/skus/`**. El usuario confirmó que el sitio cambió
  de estructura y ya no hay HTML de esta pantalla. La referencia es entonces la maqueta que ya
  estaba construida (`inertia/pages/skus.tsx` antes de esta feature), que se replica tal cual.
- **Columnas: `Nombre` | `Tipo` | `Estatus` | `Familia` | `Módulo de salud` | `Especialidad` |
  (acción)** (7 columnas). Solo `Nombre` (+ subtexto) y la acción tienen dato real:
  - `Tipo` = constante `TIPO_DUMMY = 'Tratamiento'` (toda fila de la tabla es un tratamiento).
  - `Estatus` = pill con constante `ESTATUS_DUMMY` (verde `check` + "Activo").
  - `Familia`, `Especialidad` y `Módulo de salud` = `SIN_DATO_DUMMY = '—'`.
- Botones `Nuevo SKU`, `Edición masiva` y `Ordenar`, y la acción por fila (`externalLink`),
  siguen siendo **maqueta**: no hay ruta que escriba ni que abra detalle.
- El pie conserva el texto `Ultima actualización 14/07 10:59` como **dummy** (decisión del
  usuario: "esa etiqueta es de otra cosa, la mantenemos como dummie por ahora"), aunque
  `created_at` sí existe y podría mostrarse real (máx. 2026-09-28).
- Los 3 buscadores pasan a ser un `<form>` con la clase `insumos-toolbar` para el override de
  `flex-direction: row` (el CSS global pone `form { flex-direction: column }`) e `onKeyDown`
  propio, porque un form sin botón submit no hace *implicit submission* fiable con Enter.

## Criterios de aceptación
- [x] AC-SKU-001 · El listado trae datos reales de `dev."SKU"` con total correcto (255).
- [x] AC-SKU-002 · La tabla tiene las 7 columnas de la maqueta, en el mismo orden.
- [x] AC-SKU-003 · El subtexto `Tratamiento {ID} · SKU {ID SKU}` sale de `"ID tratamiento"` y
      `"ID SKU"` de cada fila real.
- [x] AC-SKU-004 · `Tipo` muestra siempre "Tratamiento" (dummy declarado).
- [x] AC-SKU-005 · `Estatus` muestra siempre el mismo pill (dummy declarado).
- [x] AC-SKU-006 · `Familia`, `Especialidad` y `Módulo de salud` muestran `—`.
- [x] AC-SKU-007 · La búsqueda por nombre ignora mayúsculas (`ortodoncia` → 72 filas).
- [x] AC-SKU-008 · La búsqueda por ID de tratamiento funciona con **coincidencia parcial**
      (`500` → 6 filas, `5004` → 1).
- [x] AC-SKU-009 · La búsqueda por ID SKU funciona sobre el texto (`2.3` → 3 filas, porque
      `"ID SKU"` no es único).
- [x] AC-SKU-010 · Los 3 filtros son combinables e independientes
      (`APARATO DE ORTODONCIA` + `5004` + `2.3` → 1 fila).
- [x] AC-SKU-011 · Los comodines `%` y `_` se buscan literalmente (0 resultados, no 255).
- [x] AC-SKU-012 · El filtro se conserva al cambiar de página. Verificado por HTTP el 2026-10-02:
      `?nombre=ortodoncia&page=2` devuelve `total` 72 (no 255), `lastPage` 8, las filas siguen
      todas filtradas y son distintas de la página 1 (ids `106,107,108` frente a `8,9,10`).
- [x] AC-SKU-013 · La paginación es real: 255 filas con `perPage` 10 da 26 páginas, y el pie
      muestra el rango correcto (`1-10 de 255`).
- [x] AC-SKU-014 · El orden es ascendente por `id`, estable entre páginas
      (página 1: `id` 8, 9, 10 …; página 26: `id` 282, 284, 285, 286, 287).
- [x] AC-SKU-015 · La consulta se ejecuta dentro de `withConnectionRetry()`.
- [x] AC-SKU-016 · Las props se limitan a `id`, `nombre`, `tratamiento`, `codigo` (las 21
      columnas no consultadas no llegan al navegador).
- [x] AC-SKU-017 · Requiere sesión: sin cookie, 302 a `/`. Cerrado con la evidencia ya ejecutada
      de `TC-AUT-007` (`GET /skus` sin cookie → 302 a `/`): la ruta sigue dentro del grupo de
      `middleware.auth()` y el cambio de maqueta a controller no tocó el middleware.

### Evidencia de verificación (2026-10-02)

**Verificaciones estáticas**: `node ace codegen`, `npm run lint -- --fix` y `npm run typecheck`
en verde.

**SQL de los 3 filtros ejecutado directo contra Supabase** (solo `SELECT`, sin pasar por HTTP),
con los mismos patrones que arma el controller:

| Consulta | Resultado |
|---|---|
| `count(*) from dev."SKU"` | 255 |
| `"Nombre" ILIKE '%ortodoncia%'` | 72 |
| `"ID tratamiento"::text ILIKE '%500%'` | 6 |
| `"ID tratamiento"::text ILIKE '%5004%'` | 1 |
| `"ID SKU" ILIKE '%2.3%'` | 3 |
| Los 3 filtros a la vez (`%APARATO DE ORTODONCIA%` + `%5004%` + `%2.3%`) | 1 |
| `"Nombre" ILIKE '%\%%'` (comodín escapado) | 0 |
| `"Nombre" ILIKE '%\_%'` (comodín escapado) | 0 |
| `"Nombre" ILIKE '%_%'` (comodín sin escapar) | 255 |
| `"ID tratamiento" ILIKE '%500%'` **sin cast** | **ERROR: `operator does not exist: bigint ~~* unknown`** |
| `offset 250 limit 10` (página 26) | `id` 282, 284, 285, 286, 287 |

El par de filas 0 vs 255 del `_` demuestra que `escapeLike()` está funcionando y que los comodines
se buscan literalmente. El error sin cast es la razón de BR-SKU-002: PostgreSQL no castea `bigint`
a texto implícitamente, así que el cast es obligatorio, no cosmético.

**No se ejecutó smoke HTTP** (decisión explícita del usuario: revisión manual en el navegador,
igual que en FEATURE-006). La verificación fue doble: SQL directo contra Supabase para la lógica
de filtros y orden, y revisión visual del usuario para el renderizado.

**Revisión manual del usuario en el navegador (2026-10-02)**: el usuario abrió `/skus` con sesión
válida y confirmó que la pantalla se ve bien, lo que cierra los AC de renderizado: AC-SKU-002
(7 columnas en orden), 003 (subtexto con valores reales), 004 (`Tipo` = "Tratamiento"), 005 (pill
de `Estatus`), 006 (`Familia`/`Especialidad`/`Módulo de salud` = `—`) y 013 (pie `1-10 de 255`).
Recordatorio técnico: esta app **no tiene SSR**, así que el HTML servido es el shell más el
`data-page` y el markup de la tabla lo monta React en el cliente; por eso los AC de columnas y
subtexto solo se pueden cerrar mirando la pantalla.

Queda **un solo caso de prueba abierto**, `TC-SKU-012` (el Enter dispara la búsqueda), porque
vive en el `onKeyDown` del formulario y solo el navegador lo demuestra.

**Humo HTTP del filtro (2026-10-02, solicitado por el usuario antes del commit)**: script throwaway
en `%TEMP%\opencode\verify-sku-filtro.mjs` que inserta un `magic_links` en `tmp/db.sqlite3`, toma
la cookie con `GET /auth/magic/:token` y pide `/skus` parseando el `data-page` de Inertia, sin
navegador. **31/31 checks en verde**, con la tabla completa en
[08-quality/test-cases.md](../08-quality/test-cases.md). Con eso quedan ejecutados 15 de los 16
`TC-SKU-*` (más `TC-AUT-007` y `TC-AUT-008`), y los AC que dependían de observar la respuesta
HTTP quedan cerrados con evidencia y no con inferencia.

Hallazgo de esa prueba: `pg` devuelve los `bigint` como texto, así que `id` viajaba como `"8"`
aunque el modelo lo declara `number`. Se castea en el controller (`Number(sku.id)`). Los checks
de `?page=0`, `?page=-2` y `?page=` confirman en vivo el saneo: sin él esos tres devolvían 500.

## Casos límite
- `id` disperso (8-287): la paginación ordena por `id`, no por número de fila, así que los huecos
  no producen páginas vacías intermedias.
- `"ID tratamiento"` es `bigint`: `ILIKE` no se puede aplicar directamente (no hay cast
  implícito de bigint a text en PostgreSQL), por eso el filtro usa `"ID tratamiento"::text`
  (BR-SKU-002). Un término no numérico simplemente no encuentra nada.
- `"ID SKU"` es texto tipo `'2.3'`, y **no es único** (253 distintos en 255 filas): el buscador
  puede devolver varias filas, está bien.
- Página fuera de rango: devuelve la página vacía con su número.
- `%` y `_` en el término: se escapan antes del `ILIKE`.
- Texto vacío: no se aplica ese filtro.
- Nombres largos (hasta ~120 caracteres): rompen la línea en la celda según el CSS actual.
- Conexión inactiva caída por el servidor: pool + keepalive + un reintento.

## Pruebas esperadas
### Unitarias
- `escapeLike()` escapa `%` y `_`.

### Integración
- `SkusController.index` devuelve `total`, `page`, `lastPage` y aplica los 3 filtros.

### E2E
- Abrir `/skus`, buscar por cada uno de los 3 campos, paginar hasta la última página y comprobar
  el total (255), el orden y el subtexto.

## Dependencias
- Proyecto Supabase con `dev."SKU"`.
- `SUPABASE_DB_URL` en `.env` (con contraseña incluida).
- Driver `pg`.

## Riesgos
- **Inactividad**: Supabase corta conexiones ociosas → mitigado con `keepAlive`, pool
  `idleTimeoutMillis` 30 s y un reintento.
- **5 de 7 columnas son dato dummy**: si alguien las lee como reales, el dato es falso.
  Mitigación: están declaradas como constantes del frontend (`TIPO_DUMMY`, `ESTATUS_DUMMY`,
  `SIN_DATO_DUMMY`) y esta regla (BR-SKU-001) está documentada.
- **Esquema duplicado con valores distintos**: `dev."SKU"` y `public."SKU"` difieren en ~210 filas
  de costo/margen. Si alguien invierte el `searchPath`, dejaría de leer la tabla documentada
  (BR-SKU-003). Hoy ninguna columna visible difiere entre ambos esquemas.
- **Sin plantilla de diseño**: las 7 cabeceras y los valores de ejemplo de la maqueta no se
  pudieron contrastar contra Dentalia (el usuario confirmó que el sitio cambió de estructura).
  Si aparece el HTML real, hay que revalidar columnas y buscadores.
- **Campos sin definición de negocio**: "Familia", "Especialidad", "Módulo de salud" y "Tipo"
  siguen sin definición oficial (ver `docs/01-requirements/modulos-pendientes.md`). Se implementa
  la lectura del catálogo, no la semántica.

## Ready for Development
- [x] Requirement definido.
- [x] Reglas de negocio identificadas.
- [x] Impacto en datos definido (solo lectura).
- [x] API definida (ruta Inertia `GET /skus`).
- [x] Permisos definidos (`sku:read`).
- [x] UX/UI disponible (la maqueta existente; **no** hay HTML de referencia).
- [x] Criterios de aceptación verificables.
- [x] Dependencias y riesgos visibles.
- [x] Decisiones bloqueantes resueltas.

### Decisiones bloqueantes resueltas
- **Referencia de diseño**: no existe `Plantillas/skus/` (el sitio cambió de estructura), así que
  la maqueta ya construida es la referencia (decidido por el usuario).
- **Columnas sin origen**: se conservan las 7 de la maqueta y las 5 no derivables se pintan como
  dummy declarado (`Tipo` constante, `Estatus` pill constante, `Familia`/`Especialidad`/`Módulo`
  en `—`), con el patrón de `SKUS_DUMMY` de FEATURE-008 (decidido por el usuario).
- **Columnas extra**: **no** se agregan columnas reales que la maqueta no tiene, ni `Insumos`
  (que sí se podría contar vía `public."Insumos_SKU"`), ni precios, ni `sesiones`, ni
  `Pasa por lab` (decidido por el usuario).
- **Filtro de ID de tratamiento**: coincidencia **parcial con cast a texto**
  (`"ID tratamiento"::text ILIKE`), no igualdad numérica (decidido por el usuario).
- **"Última actualización"**: se mantiene el texto `14/07 10:59` inventado como dummy, aunque
  `created_at` exista (decidido por el usuario).
- **Alcance**: solo lectura. `Nuevo SKU`, `Edición masiva`, `Ordenar` y la acción por fila siguen
  de maqueta.
- **Orden**: ascendente por `id` (mismo criterio que insumos, kits y zonas).
- **Paginación**: `perPage` 10, igual que el resto de catálogos; con 255 filas da 26 páginas.

## Definition of Done
- [x] Implementación completa.
- [x] Pruebas aprobadas - **humo HTTP del filtro, 31/31 checks en verde el 2026-10-02** (pedido
      explícito del usuario, con la tabla en `08-quality/test-cases.md`) **más revisión manual en
      el navegador** el mismo día (columnas, dummies y subtexto) **más el SQL de los 3 filtros**
      contra Supabase. 15 de 16 `TC-SKU-*` ejecutados; queda `TC-SKU-012` porque el Enter vive
      en el cliente.
- [ ] Code Review aprobado - **no formalizado**: no hay proceso de review en el repositorio.
- [ ] CI aprobado - **no disponible: el proyecto no tiene CI** (brecha).
- [x] API/BD/docs actualizados (`01-requirements`, `02-functional-design`, `03-architecture`,
      `04-database`, `05-api`, `08-quality`, `features/`, `docs/README.md` y `AGENTS.md`).
- [ ] QA/UAT completado - **no aplica: no hay ambiente de pruebas**.

## Brechas
- `Nuevo SKU`, `Edición masiva`, `Ordenar` y la acción por fila son maqueta, sin escritura ni
  detalle.
- `Tipo`, `Estatus`, `Familia`, `Especialidad` y `Módulo de salud` son dummy; `Familia` y
  `Especialidad` no se pueden ni calcular (`public.familias` y `public.especialidades` tienen 0
  filas) y `Módulo de salud` no tiene ninguna relación con `SKU`.
- "Última actualización" es texto fijo; `created_at` existe y no se usa.
- No se muestra información financiera del SKU (precios, comisiones, márgenes) pese a estar en la
  tabla.
- Sin cobertura automatizada: los criterios se validan con revisión manual y scripts de humo
  descartables.
- `"Nombre"` y `"ID SKU"` admiten `NULL` en el esquema, pero ninguna de las 255 filas lo trae
  (verificado el 2026-10-02). El modelo los declara `string` no nulable y la pantalla los
  interpola directo, así que una fila con `NULL` se vería vacía. No se inventó un texto sustituto
  (`—`) porque es una decisión de negocio pendiente; si Odoo llega a cargar un `NULL`, hay que
  cambiar el modelo a `string | null` y decidir el placeholder en la vista.