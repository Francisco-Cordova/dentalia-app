# AGENTS.md

Dentalia: clon del catálogo de Dentalia. AdonisJS 7 + Inertia + React 19 + Lucid.
UI y rutas **replican** `Plantillas/<seccion>/Dentalia catalogo digital.html` (140 archivos
versionados, incl. el dump de assets) — ese HTML es la fuente de verdad de diseño cuando
hay que recrear o ajustar una pantalla.

**Excepción conocida (2026-10-02)**: no existe `Plantillas/skus/` ni `Plantillas/familias/`, y
`Plantillas/insumos/` tampoco. El usuario confirmó que **el sitio de Dentalia cambió de
estructura**, así que esas referencias ya no existen que capturar. Para `/skus` la referencia
de diseño quedó siendo la maqueta que ya estaba construida; si algún día aparece el HTML
real, hay que revalidar columnas y buscadores.

## Comandos

```bash
npm run dev              # node ace serve --hmr, puerto 3333 (PORT en .env)
npm run lint -- --fix    # ESLint flat config (@adonisjs/eslint-config + react)
npm run typecheck        # tsc --noEmit (server) + tsc -p inertia/tsconfig.json
node ace codegen         # regenera .adonisjs/* y los tipos de inertia/
node ace test            # Japa: suites unit/functional/browser (ver abajo)
```

- **No existe script `npm run codegen`** → usa `node ace codegen`. Es obligatorio tras crear
  un controller o cambiar rutas/modelos, si no `#generated/*` no compila.
- Orden de verificación: `lint --fix` → `typecheck` → arranque de `dev`. Los dos son gates
  de CI local; `typecheck` cubre también el proyecto Inertia aparte del server.
- `npm test` hoy no ejecuta nada: solo existe `tests/bootstrap.ts`, sin `*.spec.ts`. La
  verificación de páginas es manual (smoke por HTTP contra `localhost:3333`): scripts
  throwaway en `%TEMP%\opencode\verify-*.mjs` que insertan un token de magic link en
  `tmp/db.sqlite3` y luego piden las rutas con el cookie de sesión. No los commitees.
- PowerShell: si `npm` no resuelve, `npm.cmd`. Para destrabar el puerto:
  `netstat -ano | findstr :3333` y `Stop-Process -Id <pid>`.

## Reglas de lint que no son negociables

- **Archivos en snake_case** (`@unicorn/filename-case: error`). Por eso la página es
  `inertia/pages/modulos_de_salud.tsx` y la ruta hace
  `router.on('/modulos-de-salud').renderInertia('modulos_de_salud', {})`.
- El **nombre de la página debe coincidir** con el argumento de `renderInertia()` /
  `inertia.render()`, porque `inertia/app.tsx` resuelve `./pages/${name}.tsx`.
- **`Link` y `Form` salen de `@adonisjs/inertia/react`**, nunca de `@inertiajs/react`
  (`@adonisjs/prefer-adonisjs-inertia-link|form` son errores). Navegación por nombre de
  ruta: `<Link route="insumos">`, y para queries `useRouter().get(route('insumos'), {},
  { qs: { nombre, codigo, page } })` (`route()` viene de `@tuyau/core`).
- `usePage` sí viene de `@inertiajs/react`. Los tipos de props usan `InertiaProps<T>` de
  `inertia/types.ts`.

## Dos conexiones de base de datos

| conexión | driver | uso | notas |
|---|---|---|---|
| `sqlite` (default) | better-sqlite3 | auth: `users`, `magic_links`; y el catálogo de `/usuarios` | archivo `tmp/db.sqlite3` |
| `supabase` | pg | catálogo (`Insumos`, `Kits`, `zonas`, `modulos_salud`) | solo lectura, `searchPath: ['dev','public']` |

- `supabase` es **secondary y read-only**: `migrations.paths: []`. Nunca
  `node ace migration:run --connection=supabase`; las tablas ya existen en Supabase.
- `searchPath` pone **`dev` primero** (knex ejecuta `set search_path to 'dev','public'`) por
  eso los modelos no declaran `static schema`. Si una tabla futura vive en otro schema,
  quita el fallback `public` o usa `static schema` en ese modelo.
- `SUPABASE_DB_URL` (solo en `.env`, gitignored) **debe incluir la contraseña**:
  `postgresql://postgres.<ref>:<PASSWORD>@<host>:5432/postgres`. Sin `:PASSWORD` falla con
  `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`.
- Opciones que el tipo de Lucid no declara (`keepAlive`, `pool`) viven en el const
  `supabaseConnection` de `config/database.ts`; knex las reenvía a node-postgres.
- **Supabase corta conexiones inactivas.** Envolver toda consulta al catálogo en
  `withConnectionRetry()` de `app/services/with_connection_retry.ts` (import `#services/...`);
  reintenta una vez. Medido el 2026-09-30: el pool de `pg` ya descarta el cliente muerto y
  entrega otro, así que el reintento casi nunca llega a ejecutarse. Es una red de seguridad
  para cuando el error escapa al pool, no lo que evita el fallo. **No aplica a `sqlite`**:
  `/usuarios` consulta la conexión local y no lo usa.

## Tabla Insumos (nombre real con mayúscula)

- Esquema `dev`, tabla `"Insumos"`, ~5,060 filas, columnas en mayúsculas (`ID`, `NAME`,
  `DEFAULT_CODE`, `MARCA`, `CANTIDAD`, `UNIT_COST`, `modified_at`, ...). El modelo
  `app/models/insumo.ts` usa `static connection = 'supabase'` y `static table = 'Insumos'`,
  y mapea a la UI: `nombre`, `codigo`, `categoria` (= `MARCA`), `cantidad`, `costo`.
- El buscador "ID" filtra por `DEFAULT_CODE`, no por `ID`. Búsqueda con
  `ilike %term%` + `escapeLike()` (escapa `%` y `_`). Paginación de 10 y orden por `ID` asc.
- El controller (`app/controllers/insumos_controller.ts`) devuelve datos planos
  (`inumos.total`, `page`, `lastPage`, filtros) para que la página no dependa del formato de
  `paginate()`.
- Pendiente conocido: "Ordenar" y "Última actualización" son estáticos en la UI
  (`modified_at` sí existe para la fecha real).
- Total verificado el 2026-09-30: `SELECT count(*) FROM dev."Insumos"` → 5,060.

## Tabla Kits (`dev."Kits"`)

- 40 filas, `id` **disperso entre 7 y 136** (los 1-6 no existen). Orden por `id` asc, no supongas
  contigüidad. Columnas: `id`, `created_at`, `"Nombre"`, `"ID_odoo"`, `"Costo"`, `"Descripcion"`,
  `"Insumos"`. El modelo `app/models/kit.ts` mapea a la UI `nombre`, `codigo`, `costo`,
  `descripcion`, `insumosRaw`, `createdAt`.
- **`"Insumos"` NO es un número**: es una lista de `DEFAULT_CODE` separados por coma
  (`"M2625 , M1711 , M2203"`). La columna "Insumos" de la tabla muestra el **conteo**, que calcula
  el controller partiendo por coma y recortando cada token. Hay 3 filas con `"Insumos"` en NULL
  (conteo 0) y con `"Costo"` en NULL (la UI muestra `—`, no `$0.00`).
- `public."Kits"` **no es un duplicado** como sí lo es `public."Insumos"`: es la tabla
  desnormalizada de detalle (una fila por kit×insumo) con `id_kit`, `id_insumo`,
  `Cantidad requerida numero`, `Costo unitario` y `Usos`. Ahí está la cantidad por insumo que
  `dev."Kits"` no guarda. La app aún no la consulta.
- Buscadores: "nombre" → `"Nombre"`, "ID" → `"ID_odoo"` (igual que Insumos, donde "ID" no filtra
  el `ID` numérico). `ilike %term%` + `escapeLike()`. La UI muestra el código con prefijo `#`.
- Pendiente conocido: "Ordenar" y "Última actualización" estáticos (decidido así por el usuario;
  `created_at` existe). El modal "Nuevo kit" y el botón `···` son maqueta: **no hay ruta que
  escriba** en kits.

## Tabla zonas (`dev."zonas"`)

- 2 filas, `id` 1 y 2 (contiguos). Tabla y columnas en **minúsculas**: `id`, `nombre`,
  `descripcion`, `costo`, `created_at`, `updated_at`. El modelo `app/models/zona.ts` mapea a la UI
  `id`, `nombre`, `descripcion`, `createdAt`.
- **`costo` existe (`real`) pero NO se declara en el modelo a propósito**: es `NULL` en las 2
  filas y la columna no aparece en la pantalla. No es un descuido; si algún día se muestra, se
  agrega con su formato.
- `public."zonas"` **sí es un duplicado exacto** de `dev."zonas"` (mismas columnas y 2 filas,
  verificado con `EXCEPT` en ambos sentidos), a diferencia de `public."Kits"`, que es tabla de
  detalle. El `searchPath` pone `dev` primero.
- La columna "Clínicas" **no está** en `dev."zonas"`: sale de contar las filas de
  `public.clinicas_zonas` con el mismo `zona_id` (13 filas, FKs reales a `public."clinicas"` y
  `public."zonas"`). El controller lo hace con una **subconsulta correlacionada** en el `select`,
  no con `join` + `groupBy`: `paginate()` arma su total con `clearSelect().count()`, y un join
  contaría filas de la unión y no zonas. `Turista` → 7, `Nacional` → 6.
- Buscador único: "nombre" → `nombre`. `ilike %term%` + `escapeLike()`. El `id` va bajo el nombre
  **sin** prefijo `#` (a diferencia de kits, aquí no hay código de Odoo). No hay columna "Costo"
  ni "Última actualización" en la referencia.
- Paginación de 10 funcional aunque hoy haya 1 sola página (2 filas); queda preparada para cuando
  Odoo cargue más zonas. El modal "Nueva zona" y el botón `···` son maqueta: **no hay ruta que
  escriba** en zonas.

## Tabla módulos de salud (`dev.modulos_salud`)

- 10 filas, `id` 1 a 10 (contiguos). Tabla y columnas en **minúsculas**: `id`, `nombre`,
  `descripcion`, `created_at`, `updated_at`, `id_modulo`. El modelo `app/models/modulos_salud.ts`
  mapea a la UI `id`, `nombre`, `descripcion`, `createdAt`.
- **`id_modulo` (`bigint`, `NOT NULL`) NO se declara en el modelo a propósito**: no coincide con `id`
  (fila `id` 1 → `id_modulo` 13; fila `id` 8 → `id_modulo` 1), así que es un identificador de otro
  origen cuyo significado se desconoce, y no aparece en la pantalla ni en la plantilla de
  referencia. `updated_at` tampoco se declara: esta pantalla no tiene "Última actualización".
- `public.modulos_salud` **es un duplicado exacto** de `dev.modulos_salud` (mismas 6 columnas y
  mismas 10 filas, verificado con `EXCEPT` en ambos sentidos). El `searchPath` pone `dev` primero.
- **La tabla no tiene ninguna FK** que entre ni salga (verificado en `information_schema`), y
  `public."SKU"` (255 filas) tampoco tiene columna ni FK hacia un módulo. Por eso **la columna
  "SKU" de la pantalla NO es derivable**: se muestra `0` como dato dummy, declarado en el frontend
  como constante `SKUS_DUMMY` en `inertia/pages/modulos_de_salud.tsx`. Si algún día se calcula de
  verdad, esa constante desaparece y el valor pasa a venir del controller.
- Buscador único: "nombre" → `nombre`. `ilike %term%` + `escapeLike()`. Orden por `id` asc,
  `perPage` 10 (con 10 filas exactas queda 1 sola página: pie `1-10 de 10`).
- **La tabla tiene 3 columnas** (`Nombre`, `SKU`, `Opciones`) como la plantilla de referencia: el
  número de SKUs va bajo "SKU" y el botón trash (phosphor, confirmado en el HTML) bajo "Opciones".
  La maqueta anterior tenía 4 columnas con el número en "Opciones" y una "Acciones" extra; se
  descartó al seguir el HTML. El modal "Nuevo módulo de salud" y el botón trash son maqueta: **no
  hay ruta que escriba ni borre**.

## Tabla SKU (`dev."SKU"`)

- **255 filas**, `id` **disperso entre 8 y 287** (los 1-7 no existen), como `dev."Kits"`. Orden por
  `id` asc, `perPage` 10 → **26 páginas**.
- **25 columnas, en MAYÚSCULAS y con espacios** (por eso el SQL crudo las necesita entre comillas
  dobles: `"Nombre"`, `"ID tratamiento"`, `"ID SKU"`). El modelo `app/models/sku.ts` declara
  **solo 4** (`id`, `nombre`, `tratamiento`, `codigo`): las otras 21 no se muestran.
- **`public."SKU"` NO es un duplicado exacto**: 255 filas con los mismos 255 `id`, pero `EXCEPT`
  en ambos sentidos devuelve **211 filas** que difieren. La diferencia está **solo en costo y
  margen**: los 4 `"Costo Nacional/Turista og/espcialista"` (210), `"Costo insumos"` (206), los 4
  `"Margen *"` (206) y `"Costo laboratorio"` (1). Nombre, IDs, `created_at`, `sesiones`, `Insumos`,
  `Pasa por lab`, comisiones y **precios son idénticos**. El `searchPath` pone `dev` primero y `dev`
  es la fuente documentada.
- **Trampa de tipos (importante)**: `"ID tratamiento"` es `bigint` y PostgreSQL **no** castea
  `bigint` a texto de forma implícita, así que un `where('ID tratamiento', 'ilike', ...)` falla con
  `operator does not exist: bigint ~~* unknown`. El filtro del controller usa
  `whereRaw('"ID tratamiento"::text ILIKE ?', ...)`, que además habilita la coincidencia parcial
  (`500` encuentra el `5004`).
- **El mismo `bigint` en la salida**: `pg` devuelve los `bigint` como **texto**, así que `id` llega
  como `"8"` aunque el modelo lo declare `number` y las props lo tipen `number`. Por eso el
  controller castea `id: Number(sku.id)` (y `String(sku.tratamiento)`). Verificado el 2026-10-02
  con humo HTTP: antes del casteo `typeof props.skus[0].id === 'string'`. No confíes en que la
  declaración del modelo coincida con lo que llega al navegador.
- `"ID SKU"` es **texto** tipo `'2.3'`, no un número, y **no es único** (253 distintos en 255
  filas): el buscador por ID SKU puede devolver varias filas y eso es correcto.
- **5 de las 7 columnas de la pantalla son DUMMY**, declaradas como constantes en
  `inertia/pages/skus.tsx` (`TIPO_DUMMY`, `ESTATUS_DUMMY`, `SIN_DATO_DUMMY`): `Tipo` = "Tratamiento",
  `Estatus` = pill "Activo", y `Familia`/`Especialidad`/`Módulo de salud` = `—`. **No son
  derivables**: no hay columna que corresponda, `public.familias` y `public.especialidades` tienen
  **0 filas** y `SKU` no tiene ninguna FK hacia módulos. Mismo patrón que `SKUS_DUMMY` de MSD.
- El subtexto `Tratamiento {tratamiento} · SKU {codigo}` sale de `"ID tratamiento"` y `"ID SKU"`.
- El pie conserva `Ultima actualización 14/07 10:59` como **dummy** (decisión del usuario), aunque
  `created_at` existe (2025-09-18 a 2026-09-28).
- `dev."SKU"` **no tiene ninguna FK** que entre ni salga. Las FKs del entorno apuntan a **`public`**:
  `public."Insumos_SKU"` (1,904 filas, 150 SKUs con insumos) y `public.precios_comisiones` (496)
  referencian `public."SKU"("ID tratamiento")`; `public.kit_sku` (1,179, 209 SKUs) trae
  `id_tratamiento` **sin FK**. **No se consultan**: si algún día se quiere contar insumos o kits por
  SKU, hay que unir contra `public`, no contra `dev`.
- `created_at` es `NOT NULL DEFAULT now()`; `"Nombre"` e `"ID SKU"` admiten `NULL` pero ninguna de
  las 255 filas lo trae. `sesiones` va de 1 a 6. `"Sesion se paga"` trae un `1111` absurdo.
  `"Pasa por lab"` es texto sucio: `no` 127, `false` 71, `yes` 44, `NULL` 13.
- Precios: solo **34 de 255 filas** con `"Precio Nacional"` ≠ 0 (rango 0-51,800), 17 `NULL`. Por eso
  la pantalla **no muestra** información financiera (decisión del usuario).
- `Nuevo SKU`, `Edición masiva`, `Ordenar` y la acción por fila (`externalLink`) son maqueta: **no
  hay ruta que escriba ni ruta de detalle**.

## Tabla `users` (SQLite, no Supabase)

- `/usuarios` es el único catálogo que **no** lee Supabase: lee `users` de la conexión `sqlite`
  default, la misma tabla de la autenticación. Por eso no usa `withConnectionRetry()`.
- 3 columnas de pantalla (`area`, `rol`, `superadmin`) las añade la migración
  `1780000000000_add_area_rol_superadmin_to_users_table`. **Son informativas**: nada las lee para
  autorizar; el único control sigue siendo `middleware.auth()`.
- `password` es `NOT NULL` (hash scrypt) aunque el login real sea por magic link. El controller
  **selecciona columnas una a una** y jamás pide `SELECT *`, para que el hash no llegue al
  navegador. Mantener esa costumbre al añadir campos.
- Buscador único `q`: `full_name` **o** `email` con `LIKE` de SQLite (case-insensitive solo para
  ASCII), escapando `%`/`_`. El `OR` con `email` es a propósito: el alta por magic link no pide
  nombre y `full_name` suele venir `NULL`.
- **Trampa de SQLite: el `LIKE` de SQLite NO acepta backslash como escape** (PostgreSQL sí). Sin la
  cláusula `ESCAPE '\'` explícita, `escapeLike()` no escapa nada: `\%` exige un backslash literal y
  `%` sigue siendo comodín, así que el término no encuentra ni las filas que contienen un `%`.
  Por eso el controller usa `whereRaw("full_name LIKE ? ESCAPE '\\'", [term])` y no
  `where(..., 'like', term)`. Medido el 2026-10-01 con `better-sqlite3`: sin `ESCAPE`, buscar `%` no
  encontraba una fila que contenía `50% descuento`; con `ESCAPE`, sí.
- Orden por `id` asc, `perPage` 10. La tabla muestra 5 columnas (`Nombre`, `Correo`, `Area`, `Rol`,
  `Superadmin`): se descarta `Costo` porque en la plantilla de referencia viene vacía.
- Modal "Nuevo usuario" y menú `···`: **maqueta, no hay ruta que escriba**. Nadie puede dar de alta
  una cuenta desde la app, que es el bloqueo de negocio más urgente del proyecto.
- Contenido verificado el 2026-10-01: **1 fila** (`id 1`). Se borraron 17 usuarios de prueba que
  dejaron scripts de humo (`verify-*`, `dbg-*`, `smoke@*`); `tmp/db.sqlite3` está gitignored, así
  que hay que repetir la limpieza en otra máquina.

## Rutas y auth

- Páginas mock: `router.on('/x').renderInertia('x', {})` (hoy solo `/familias`). Con datos:
  `router.get('/skus', [controllers.Skus, 'index'])`,
  `router.get('/insumos', [controllers.Insumos, 'index'])`,
  `router.get('/kits', [controllers.Kits, 'index'])`,
  `router.get('/zonas', [controllers.Zonas, 'index'])` o
  `router.get('/modulos-de-salud', [controllers.ModulosSalud, 'index'])` o
  `router.get('/usuarios', [controllers.Usuarios, 'index'])`.
- Todo el admin está tras `middleware.auth()` (`start/routes.ts`); login es **magic link**
  (sin password). Para probar sin correo: en dev, si Mailtrap falla,
  `MagicLinkController` loguea `[MAGIC LINK DEV] <url>`; el token es de un solo uso y expira
  a los 30 min.
- **Trampa de paginación (knex, no de la app)**: `paginate(page, perPage)` calcula
  `offset = (page - 1) * perPage` y knex **lanza** con offset negativo o `NaN`
  (`A non-negative integer must be provided to offset.`), o sea un **500 por URL escrita a
  mano**: `?page=0`, `?page=-2` y `?page=` (vacío, porque `Number('') === 0`) revientan;
  `?page=abc` deja un warning de knex y `?page=1.5` se comporta como offset 5. Hay que sanear:
  `Number.isInteger(n) && n > 0 ? n : 1`. **Los 6 catálogos ya lo sanearon** (2026-10-02, junto con
  FEATURE-003); no lo saltes al escribir uno nuevo.
- Al tocar el sidebar se actualizan dos ramas: la sección activa
  (`inertia/layouts/admin.tsx`, `activeSection`) y la clase `active` del subitem.

## Frontend

- Todo el CSS vive en `inertia/css/app.css` (sin Tailwind, sin CSS modules).
- Trampas de CSS global que ya rompieron layouts: `form { flex-direction: column }` y
  `label { display: block }` afectan **todo** el markup de página. Hoy se corrige con
  `.insumos-toolbar { flex-direction: row }`; no introduzcas un `<form>` con varios campos
  esperando un layout horizontal sin ese override.
- Un `<form>` con 2+ inputs y sin botón submit **no** hace implicit submission con Enter:
  por eso el buscador de insumos intercepta `onKeyDown`. replica ese patrón.
- Iconos: `inertia/components/icon.tsx` (wrapper de Phosphor); no agregues otra librería.

## Entorno

- `.env` tiene PORT 3333, credenciales SMTP de Mailtrap y `SUPABASE_DB_URL`; está
  gitignored. `.env.example` es el placeholder. No imprimas ni commitees secretos.
- `node ace` es el entrypoint de todo (no hay scripts directos a `bin/`).
- HMR: `package.json → hotHook.boundaries` solo cubre `app/controllers/**` y
  `app/middleware/*.ts`. Cambios en `config/`, `app/models/`, `.env` o `adonisrc.ts`
  **requieren reiniciar** `npm run dev` (por ejemplo, para que `searchPath` o `keepAlive`
  apliquen hay que reiniciar, no basta con guardar).
- Commits en español, rama `master`.

## Commits

- **Nunca hagas `git commit`, `git push`, `git tag` ni abras PR sin que el usuario lo pida
  explícitamente.** Autorizar un commit una vez no autoriza los siguientes.
- Cuando el trabajo esté listo para comitear: corre las verificaciones (`node ace codegen`,
  `npm run lint`, `npm run typecheck`), y luego **presenta el estado y espera**. Nunca
  comitees sin esa pausa.
- Lo que se presenta para revisión:
  - `git status --porcelain` — qué archivos cambiaron
  - `git diff --stat` — el tamaño del cambio
  - Un resumen de qué cambió y por qué
  - El mensaje de commit propuesto, sin aplicarlo
  - Si algo se quedó a medias o falla una verificación, dilo explícitamente
- Si el usuario pide cambios, corrige y vuelve a presentar. No comitees hasta que vuelva a
  aprobar.
- La validación manual del usuario es obligatoria. Las verificaciones automáticas (lint,
  typecheck, codegen) son necesarias pero no sustituyen esa revisión.
- Los commits existentes quedan como están: el usuario los revisó y decidió conservarlos. No hay
  remoto configurado, así que nada se ha enviado a ningún sitio. Rama de trabajo `main`.
- `Supplier of truth` **no aplica a la fase HTTP**: el usuario decidió (2026-10-02) no correr humo
  salvo que lo pida, y en FEATURE-003 lo pidió una vez para probar el filtro (31 checks, en
  `%TEMP%\opencode\verify-sku-filtro.mjs`, **no commiteado**). Para autenticar sin correo: insertar
  un `magic_links` con `token_hash = sha256(token)` en `tmp/db.sqlite3` y consumir
  `GET /auth/magic/:token`, que devuelve 302 y deja la cookie. Las props se leen del
  `<script data-page="app" type="application/json">` del HTML servido; no hace falta navegador
  (no hay SSR: el markup de la tabla lo monta React en el cliente).

- **Documentación**: `docs/` es la fuente de verdad documental. Al cambiar cualquier comportamiento (rutas, auth, BD, lógica, UI, integración), actualiza obligatoriamente: el documento del módulo correspondiente en `docs/`, `docs/01-requirements/traceability.md` y el estado de ese documento. No implementar features en estado `DRAFT` o `ANALYZED` (ver `docs/features/README.md`).
