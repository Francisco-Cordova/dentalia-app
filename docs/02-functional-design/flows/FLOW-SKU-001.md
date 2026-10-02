# FLOW-SKU-001 · Consultar el catálogo de SKUs

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-10-02 |
| Versión relacionada | (pendiente de commit) |

## Actor
Administrador autenticado.

## Precondiciones
- Sesión activa (`middleware.auth()` en el grupo de `/skus`).
- `SUPABASE_DB_URL` válido y **con contraseña incluida**; proyecto Supabase accesible.
- La conexión `supabase` tiene `searchPath: ['dev','public']`, pool acotado y keepalive.

## Flujo principal
1. El usuario pulsa "SKUs" en el sidebar y navega a `route('skus')` → `GET /skus`.
2. `SkusController.index` lee los query params `page` (por defecto 1), `nombre`, `tratamiento` y
   `codigo`, recortando los tres últimos.
3. Compone la consulta: `SELECT id, "Nombre", "ID tratamiento", "ID SKU"` sobre `dev."SKU"`, con
   `ORDER BY id ASC`.
4. Si hay `nombre`, añade `WHERE "Nombre" ILIKE '%nombre%'`.
5. Si hay `tratamiento`, añade `WHERE "ID tratamiento"::text ILIKE '%tratamiento%'`.
6. Si hay `codigo`, añade `WHERE "ID SKU" ILIKE '%codigo%'`.
   En los tres casos `%` y `_` del término van escapados.
7. Ejecuta `paginate(page, 10)` dentro de `withConnectionRetry()`: dos consultas (conteo + página).
8. Renderiza `skus` con datos planos: filas (`id`, `nombre`, `tratamiento`, `codigo`), `total`,
   `page`, `lastPage` y los tres filtros aplicados.
9. La página pinta las 7 columnas de la maqueta y la paginación calculada sobre `lastPage`.

## Por qué el filtro de tratamiento necesita cast
`"ID tratamiento"` es `bigint` y PostgreSQL **no** castea `bigint` a texto de forma implícita, así
que un `ILIKE` directo revienta. Verificado el 2026-10-02 contra Supabase:

```
dev."SKU" WHERE "ID tratamiento" ILIKE '%500%'
-> ERROR: operator does not exist: bigint ~~* unknown
```

Con el cast a texto el mismo filtro devuelve 6 filas, y la búsqueda exacta de `5004` devuelve 1. El
cast habilita además la coincidencia parcial, que es la que espera un usuario que escribe `500` en
un campo de texto.

## SQL equivalente

```sql
SELECT s.id, s."Nombre", s."ID tratamiento", s."ID SKU"
FROM dev."SKU" s
WHERE s."Nombre" ILIKE '%ortodoncia%'            -- solo si hay término, escapado
  AND s."ID tratamiento"::text ILIKE '%500%'     -- idem
  AND s."ID SKU" ILIKE '%2.3%'                   -- idem
ORDER BY s.id ASC
LIMIT 10 OFFSET 0;
```

## Búsqueda
1. El usuario escribe en cualquiera de los 3 buscadores ("Buscar Nombre", "Buscar ID de
   tratamiento", "Buscar ID SKU").
2. El `<form>` **no tiene botón submit**: la página intercepta `onKeyDown` y al pulsar Enter navega
   a `route('skus')` con los `qs` de los 3 campos que tengan contenido. Con 3 inputs el navegador no
   haría *implicit submission*, así que el `onKeyDown` es obligatorio, no redundante.
3. La URL queda como `/skus?nombre=…&tratamiento=…&codigo=…`, por lo que la búsqueda es
   compartible y sobrevive a un refresco.
4. Cada cambio de página reutiliza los 3 filtros vigentes: `qs: { page }` combinado con ellos.

## Flujos alternos

### A1 · Sin coincidencias
1. El conteo devuelve 0.
2. Se renderiza la tabla vacía con el total en 0, sin error de servidor.

### A2 · Supabase cerró la conexión por inactividad
1. La primera consulta falla con un error de conexión.
2. `withConnectionRetry()` reintenta **una vez**; el pool ya descartó el socket muerto, así que
   el segundo intento usa una conexión nueva.
3. La respuesta es 200 con datos.
4. Si también falla el reintento, el error sube al handler.

### A3 · El usuario escribe `%` o `_`
1. Los comodines se escapan, así que se buscan literalmente.
2. El catálogo no se devuelve completo. En `dev."SKU"` ningún nombre contiene `%` ni `_`, así que
   ambos términos devuelven 0 filas (verificado).

### A4 · Página fuera de rango
1. Se ejecuta el `OFFSET` correspondiente y se devuelve la página vacía con su número.

### A5 · El ID SKU devuelve varias filas
1. `"ID SKU"` **no es único** (253 valores distintos en 255 filas).
2. Buscar `2.3` devuelve las 3 filas que lo tienen. Es el comportamiento correcto, no un fallo.

### A6 · El usuario busca con los 3 campos a la vez
1. Los filtros se combinan con `AND`, cada uno independiente.
2. Verificado: `%APARATO DE ORTODONCIA%` + `%5004%` + `%2.3%` → 1 fila.

## Errores

| Condición | Respuesta | Evidencia en código |
|---|---|---|
| Sin sesión | 302 a `/` con URL pretendida | `auth_middleware.ts` |
| Conexión caída dos veces | Error del driver → página de error 500 (en DEV, con detalle) | `with_connection_retry.ts`, `exceptions/handler.ts` |
| `SUPABASE_DB_URL` sin contraseña | `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string` | Configuración, no código |
| Catálogo inaccesible | La consulta falla y el error sube al handler | `exceptions/handler.ts` |

## Diagrama

```mermaid
flowchart TD
    A[GET /skus] --> B[Lee page, nombre, tratamiento, codigo]
    B --> C['SELECT id, "Nombre", "ID tratamiento", "ID SKU" sobre dev.SKU ORDER BY id']
    C --> D{Tiene filtros?}
    D -- nombre --> E['"Nombre" ILIKE %nombre% escapado']
    D -- tratamiento --> F['"ID tratamiento"::text ILIKE %tratamiento% escapado']
    D -- codigo --> G['"ID SKU" ILIKE %codigo% escapado']
    D -- No --> H[Pagina 10]
    E --> H
    F --> H
    G --> H
    H --> I[withConnectionRetry]
    I --> J[total, page, lastPage, filas planas]
    J --> K[Render inertia.render skus]
    K --> L['Tabla 7 columnas: Nombre real + 4 celdas dummy + acción']
    M[Enter en cualquiera de los 3 buscadores] --> N['router.get route skus con los 3 qs']
    N --> A
```

## Requisitos relacionados
- RF-SKU-001 … RF-SKU-004
- BR-SKU-001 … BR-SKU-007
- AC-SKU-001 … AC-SKU-017
- [FEATURE-003](../../features/FEATURE-003-skus.md)

## Brechas

- `Nuevo SKU`, `Edición masiva`, `Ordenar` y la acción por fila no tienen comportamiento: no hay ruta
  que escriba ni ruta de detalle.
- 5 de las 7 columnas muestran datos dummy (`Tipo`, `Estatus`, `Familia`, `Especialidad`,
  `Módulo de salud`): no hay columna ni relación que las llene.
- "Última actualización 14/07 10:59" es texto fijo; `created_at` existe y no se usa.
- La información financiera (precios, comisiones, márgenes) y el conteo de insumos/kits por SKU no
  se muestran, pese a estar disponibles.
- No hay plantilla HTML de referencia: el sitio cambió de estructura y el usuario confirmó que ya no
  existe una para esta pantalla. Las 7 cabeceras y los 3 buscadores no se han podido auditar contra
  Dentalia.
- Cada navegación ejecuta dos consultas a Supabase (conteo + página); sin caché para 255 filas es
  aceptable.