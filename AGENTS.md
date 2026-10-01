# AGENTS.md

Dentalia: clon del catálogo de Dentalia. AdonisJS 7 + Inertia + React 19 + Lucid.
UI y rutas **replican** `Plantillas/<seccion>/Dentalia catalogo digital.html` (140 archivos
versionados, incl. el dump de assets) — ese HTML es la fuente de verdad de diseño cuando
hay que recrear o ajustar una pantalla.

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
| `sqlite` (default) | better-sqlite3 | auth: `users`, `magic_links` | archivo `tmp/db.sqlite3` |
| `supabase` | pg | catálogo (`Insumos`, `Kits`, y futuras tablas) | solo lectura, `searchPath: ['dev','public']` |

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
  para cuando el error escapa al pool, no lo que evita el fallo.

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

## Rutas y auth

- Páginas mock: `router.on('/x').renderInertia('x', {})`. Con datos:
  `router.get('/insumos', [controllers.Insumos, 'index'])`,
  `router.get('/kits', [controllers.Kits, 'index'])`,
  `router.get('/zonas', [controllers.Zonas, 'index'])` o
  `router.get('/modulos-de-salud', [controllers.ModulosSalud, 'index'])`.
- Todo el admin está tras `middleware.auth()` (`start/routes.ts`); login es **magic link**
  (sin password). Para probar sin correo: en dev, si Mailtrap falla,
  `MagicLinkController` loguea `[MAGIC LINK DEV] <url>`; el token es de un solo uso y expira
  a los 30 min.
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
- Los 3 commits ya existentes (`2332e22`, `7bb5ecb`, `2dcd5e6`) quedan como están: el usuario
  revisó y decidió conservarlos. No hay remoto configurado, así que nada se ha enviado a
  ningún sitio.

- **Documentación**: `docs/` es la fuente de verdad documental. Al cambiar cualquier comportamiento (rutas, auth, BD, lógica, UI, integración), actualiza obligatoriamente: el documento del módulo correspondiente en `docs/`, `docs/01-requirements/traceability.md` y el estado de ese documento. No implementar features en estado `DRAFT` o `ANALYZED` (ver `docs/features/README.md`).
