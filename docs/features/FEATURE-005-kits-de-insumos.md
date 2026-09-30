# FEATURE-005 · Kits de insumos

## Estado
READY

## Objetivo
Consultar el catálogo de kits del sistema de origen (Supabase/PostgreSQL) dentro del panel
Dentalia, con listado paginado, búsqueda por nombre y por identificador de Odoo, el conteo de
insumos que componen cada kit y su costo, con tolerancia a cortes de conexión.

## Requirement relacionado
- RF-KIT-001, RF-KIT-002, RF-KIT-003, RF-KIT-004, RF-KIT-005, RF-KIT-006

## Reglas de negocio
- BR-KIT-001, BR-KIT-002, BR-KIT-003, BR-KIT-004, BR-KIT-005, BR-KIT-006, BR-KIT-007

## Actor
Administrador autenticado.

## Permisos
- `kits:read`

## Flujo
1. El usuario autenticado navega a `route('kits')`.
2. El controller pagina `dev."Kits"` en bloques de 10, ordenados por `id`.
3. Aplica `ILike` escapado sobre `"Nombre"` y/o `"ID_odoo"` según los query params.
4. Calcula el conteo de insumos partiendo la columna `"Insumos"` por coma, recortando cada
   token y descartando los vacíos.
5. Devuelve filas planas + `total`, `page`, `lastPage` y los filtros aplicados.
6. La página muestra la tabla, el costo como moneda y la paginación.
7. Escribir en un buscador y pulsar Enter navega con los filtros; cambiar de página los conserva.

## Datos involucrados
- `dev."Kits"` (esquema `dev`, lectura). 40 filas, `id` entre 7 y 136 (disperso: los 1-6 no
  existen). Columnas en mayúsculas con tilde salvo `id` y `created_at`.
- Mapeo a la vista: `id → id`, `"Nombre" → nombre`, `"ID_odoo" → codigo`, `"Costo" → costo`,
  `"Descripcion" → descripcion`, `"Insumos" → insumosRaw`, `created_at → createdAt`.
- **No existe columna de cantidad por insumo** en esta tabla. La lista es de códigos sueltos.

### Forma de la columna `"Insumos"`
Es una lista de códigos de insumo separada por comas, no un número:

```
M2625 , M1711 , M2203 , M0886 , I1019
O0107, I0878, O0088, M0918, M1129, I1658
```

Los códigos corresponden a `dev."Insumos"."DEFAULT_CODE"`. **El espaciado es inconsistente**
(espacios a ambos lados de la coma en unas filas, solo después en otras), así que hay que
recortar cada token antes de contar.

El recorte **no cambia el resultado con las 40 filas actuales**: se verificó que en los 40
registros `split(',').length` y el conteo con recorte coinciden, porque los espacios van pegados
al token y nunca hay un token vacío. Es una defensa ante datos futuros: si Odoo escribiera una
coma final (`"A,B,"`) o una doble coma (`"A,,B"`), contar sin recortar daría un número de más.

## API
- `GET /kits` — Inertia (`inertia.render('kits', …)`).
- Query params: `page`, `nombre`, `codigo`.

## UX/UI
- Página: `inertia/pages/kits.tsx`.
- Estilos: `inertia/css/app.css` (`.skus-page`, `.skus-toolbar`, `.sku-table`, `.sku-pagination`).
- Referencia de diseño: `Plantillas/kits/Dentalia catalogo digital.html`.
- El modal "Nuevo kit" y el botón de acciones (`···`) siguen siendo maqueta: no hay escritura.

## Criterios de aceptación
- [x] AC-KIT-001 · El listado trae datos reales del catálogo con total correcto (40).
- [x] AC-KIT-002 · La búsqueda por nombre ignora mayúsculas (`CIRUGIA` encuentra `KIT DE CIRUGIA`).
- [x] AC-KIT-003 · La búsqueda por ID ignora mayúsculas (`ki1005` = `KI1005`).
- [x] AC-KIT-004 · Los comodines `%` y `_` se buscan literalmente (devuelven 0, no 40).
- [x] AC-KIT-005 · Los filtros se conservan al cambiar de página.
- [x] AC-KIT-006 · Una búsqueda sin resultados renderiza vacío sin error.
- [ ] AC-KIT-007 · La consulta sobrevive a un corte de conexión y reintenta una vez.
- [x] AC-KIT-008 · El catálogo se lee desde el schema `dev`.
- [x] AC-KIT-009 · No existe ninguna ruta que escriba en el catálogo de kits.
- [x] AC-KIT-010 · La búsqueda se dispara con Enter (el form no tiene botón submit).
- [x] AC-KIT-011 · Los dos buscadores se muestran en fila, no apilados.
- [x] AC-KIT-012 · La columna "Insumos" muestra el conteo de tokens, y el recorte no altera
      el resultado con los datos actuales pero protege ante comas vacías.
- [x] AC-KIT-013 · Un `Costo` nulo renderiza `—` y no `$0.00`.
- [x] AC-KIT-014 · El identificador se muestra con prefijo `#` (`KI1005` → `#KI1005`).

## Casos límite
- `"Insumos"` nulo o vacío: el conteo es 0, nunca `NaN`.
- `Costo` nulo (3 filas de prueba: `id` 29, 31 y 32): renderiza `—`.
- `Descripcion` nulo (11 filas): no se muestra en la tabla, así que no Molesta.
- Búsqueda por el identificador numérico: el campo rotulado "ID" filtra `"ID_odoo"`, igual
  que en Insumos, donde "ID" filtra `DEFAULT_CODE` y no `ID`.
- `id` disperso (7 a 136): el orden es por `id`, no por posición, y no se asume contigüidad.
- Página fuera de rango: devuelve la página vacía con su número.
- `%` y `_` en el término: se escapan antes del `ILIKE`.
- Texto vacío: no se aplica filtro.
- Conexión inactiva caída por el servidor: pool + keepalive + un reintento.

## Pruebas esperadas
### Unitarias
- `escapeLike()` escapa `%` y `_`.
- El conteo de insumos recorta tokens y descarta vacíos (`"A , B"` → 2, `"A,B,"` → 2 y no 3).
- El mapeo del modelo expone las 7 columnas con los nombres de la vista.
- `formatMoney()` devuelve `—` ante `null` y 2 decimales ante un `real` con más precisión.

### Integración
- `KitsController.index` devuelve `total`, `page`, `lastPage` y aplica los filtros.
- `withConnectionRetry()` reintenta una vez ante un error de conexión simulado.

### E2E
- Abrir `/kits`, buscar, paginar y comprobar el total (40, 4 páginas).
- Verificar que las 3 filas de prueba renderizan `—` en Costo y `0` en Insumos.

## Dependencias
- Proyecto Supabase con la tabla `dev."Kits"`.
- `SUPABASE_DB_URL` en `.env` (con contraseña incluida).
- Driver `pg`.

## Riesgos
- **Inactividad**: Supabase corta conexiones ociosas → mitigado con `keepAlive`, pool
  `idleTimeoutMillis` 30 s y un reintento.
- **Cadena de conexión mal formada**: sin `:PASSWORD` falla el driver SASL al abrir conexión.
- **Esquema duplicado con forma distinta**: existe `public."Kits"` con las mismas columnas pero
  **también** `id_kit`, `id_insumo`, `Cantidad requerida numero`, `Costo unitario` y `Usos`. No es
  un duplicado como sí lo es `public."Insumos"`: es una tabla desnormalizada de detalle, una fila
  por par kit×insumo. El orden del `searchPath` pone `dev` primero, así que se lee la del
  encabezado. Si alguien invierte ese orden, el conteo de insumos y el total pasan a ser otros.
- **Espaciado irregular en `"Insumos"`**: hoy no cambia ningún conteo, pero cualquier consumidor
  que compare códigos sin recortar fallaría ante un espacio. El recorte no es cosmético si más
  adelante se usan los códigos para otra cosa que no sea contarlos.
- **Filas de prueba en el catálogo**: 3 filas con nombre `… PRUEBA` tienen `Costo` e `Insumos` en
  `NULL`. Son datos de desarrollo mezclados con los reales y se muestran en el listado.
- **Coste por consulta**: cada visita ejecuta conteo + página (2 consultas).
- **Sin caché**: aceptable a 40 filas.

## Ready for Development
- [x] Requirement definido.
- [x] Reglas de negocio identificadas.
- [x] Impacto en datos definido (solo lectura).
- [x] API definida (ruta Inertia `GET /kits`).
- [x] Permisos definidos (`kits:read`).
- [x] UX/UI disponible (`Plantillas/kits/`).
- [x] Criterios de aceptación verificables.
- [x] Dependencias y riesgos visibles.
- [x] Decisiones bloqueantes resueltas.

### Decisiones bloqueantes resueltas en esta sesión
- **Alcance**: solo lectura del catálogo. No se insertan kits ni se crea la tabla de relación
  insumo×kit; eso es trabajo posterior.
- **Representación de "Insumos"**: se muestra el conteo de tokens, que es lo que define el HTML
  de referencia. Se validó contra 8 filas del diseño y 7 coinciden; `KIT DE IMPRESION` tiene 15
  códigos donde el mock decía 14, o sea el mock trae un error de tipeo a mano.
- **`Costo` nulo**: renderiza `—`. Decidido por el usuario; alternativa descartada `$0.00`, que
  ocultaría que el dato falta.
- **"Última actualización"**: sigue estática en la UI. Decidido por el usuario: se verá más
  adelante. Queda como brecha.
- **Preguntas de negocio abiertas** (ver
  [`01-requirements/modulos-pendientes.md`](../01-requirements/modulos-pendientes.md)):
  - *¿El precio del kit se calcula sumando los componentes o se define aparte?* → **Se define
    aparte.** Evidencia: `Costo` es una columna `real` almacenada e independiente de la lista de
    insumos.
  - *¿Un kit es una lista con cantidad fija o un producto con precio propio?* → **A medias.**
    `dev."Kits"` no guarda cantidades; la cantidad por insumo solo existe en
    `public."Kits"."Cantidad requerida numero"`. No se puede responder con esta tabla sola.
  - *¿Cambiar el precio de un insumo cambia el del kit?* → **Abierta.** El dato sugiere que no
    (el costo está desacoplado), pero es una decisión de negocio, no una inferencia del esquema.

## Definition of Done
- [x] Implementación completa.
- [x] Pruebas aprobadas (smoke manual sobre `GET /kits` con sesión: total, paginación, ambos
      buscadores, comodines, `—` en las filas de prueba, página fuera de rango).
- [ ] Code Review aprobado — **no formalizado**: no hay proceso de review en el repositorio.
- [ ] CI aprobado — **no disponible: el proyecto no tiene CI** (brecha).
- [x] API/BD/docs actualizados (`01-requirements`, `02-functional-design`, `04-database`,
      `05-api`, `AGENTS.md`).
- [ ] QA/UAT completado — **no aplica: no hay ambiente de pruebas**.

## Evidencia
- Archivos: `app/models/kit.ts`, `app/controllers/kits_controller.ts`, `inertia/pages/kits.tsx`,
  `docs/02-functional-design/flows/FLOW-KIT-001.md`.
- Verificaciones: `node ace codegen`, `npm run lint` y `npm run typecheck` sin errores.
- Datos confirmados el 2026-09-30: `dev."Kits"` tiene 40 filas, `id` entre 7 y 136;
  `public."Kits"` tiene 40 filas y es la tabla de detalle, no un duplicado.
- AC-KIT-007 **queda sin verificar**. El intento de provocarlo con
  `pg_terminate_backend` falló: el rol de la aplicación no tiene permiso
  (`42501 permission denied to terminate process`), porque en Supabase el rol `postgres` es
  SUPERUSER. Verificarlo requiere cortar el socket desde el lado del servidor de la app, o
  esperar a que el pool agote su `idleTimeoutMillis` de 30 s con el pooler de por medio.

## Brechas
- `Ordenar` y "Última actualización" son estáticos en la UI, aunque existe `created_at`.
- Sin detalle por kit: no hay forma de ver *qué* insumos componen un kit ni con qué cantidad.
  Requiere la tabla de relación que se añadirá después.
- El modal "Nuevo kit" y el botón `···` son maqueta, sin escritura.
- `Descripcion` se lee pero no se muestra en ningún lado de la vista.
- Sin cobertura automatizada: los criterios se validan con scripts de humo descartables.