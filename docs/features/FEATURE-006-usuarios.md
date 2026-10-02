# FEATURE-006 · Usuarios

## Estado
READY

## Objetivo
Convertir el catálogo de usuarios en una lectura real de la tabla `users` de SQLite (la misma que
usa la autenticación), con buscador, paginación y las 5 columnas de la referencia de diseño
(`Nombre`, `Correo`, `Area`, `Rol`, `Superadmin`). Para que la pantalla pueda mostrarlas se añaden
a `users` las columnas que hoy no existen: `area`, `rol` y `superadmin`.

Solo lectura: el modal "Nuevo usuario" y el menú de editar/eliminar siguen siendo maqueta.

## Requirement relacionado
- RF-USR-001, RF-USR-002, RF-USR-003

## Reglas de negocio
- BR-USR-001, BR-USR-002, BR-USR-003, BR-USR-004, BR-USR-005

## Actor
Usuario autenticado (cualquiera: hoy no hay diferenciación de roles)

## Permisos
- `usuarios:read`

## Flujo
1. El usuario autenticado entra a `/usuarios`.
2. El servidor lee `users` de la conexión `sqlite` (la default) y pagina de 10 en 10.
3. La tabla muestra `Nombre`, `Correo`, `Area`, `Rol` y `Superadmin`.
4. El buscador filtra por nombre **o** correo, sin distinguir mayúsculas.
5. Los valores vacíos se pintan como `—`.

## Datos involucrados
- `users` (SQLite, conexión default): columnas `id`, `full_name`, `email`, `area`, `rol`,
  `superadmin`. `password` **nunca** se expone.
- `magic_links`: solo para la limpieza de datos de prueba (FK `user_id → users.id`).

## API
- `GET /usuarios` (Inertia, tras `middleware.auth()`)

## UX/UI
`Plantillas/usuarios/Dentalia catalogo digital.html` — la fuente de verdad del diseño.

## Criterios de aceptación
- [ ] AC-USR-001 · El listado trae datos reales de `users` con total correcto.
- [ ] AC-USR-002 · La tabla tiene 5 columnas (`Nombre`, `Correo`, `Area`, `Rol`, `Superadmin`).
- [ ] AC-USR-003 · La búsqueda ignora mayúsculas y cubre nombre **y** correo.
- [ ] AC-USR-004 · Los comodines `%` y `_` se buscan literalmente (no devuelven el catálogo).
- [ ] AC-USR-005 · El filtro se conserva al cambiar de página.
- [ ] AC-USR-006 · Un valor `NULL` se pinta como `—`, no como texto vacío.
- [ ] AC-USR-007 · `password` no aparece en las props de la página.
- [ ] AC-USR-008 · El orden es ascendente por `id`.
- [ ] AC-USR-009 · Una búsqueda sin resultados renderiza vacío sin error.
- [ ] AC-USR-010 · `rol` y `superadmin` no alteran la autorización: la ruta sigue exigiendo solo
      `middleware.auth()`.

Los AC siguen **sin marcar**: el usuario los revisa en el navegador antes de darlos por buenos. Los
que se pueden comprobar leyendo el código (007, 008 y 010) son los más seguros; el resto requiere
mirar la pantalla.

**AC-USR-004 ya se corrigió durante la implementación.** La primera versión usaba
`where('full_name', 'like', term)`, que en SQLite **no** escapa nada: el `LIKE` de SQLite no
reconoce el backslash como carácter de escape, a diferencia del `ILIKE` de PostgreSQL, así que
`escapeLike()` era un no-op y un `%` buscado seguía siendo comodín. Medido el 2026-10-01 con
`better-sqlite3`: el patrón `%\%` solo casa con cadenas que tengan un backslash literal. El filtro
pasó a `whereRaw("full_name LIKE ? ESCAPE '\\'", [term])`, que sí devuelve la fila con un `%`
literal. Comprobado además que el SQL generado por knex es
`... where (full_name LIKE ? ESCAPE '\' or email LIKE ? ESCAPE '\') ...`.

## Casos límite
- La mayoría de los usuarios reales pueden tener `full_name` `NULL` (el alta por magic link no lo
  pide). Por eso el buscador también filtra por correo: buscando solo por nombre no aparecerían.
- `rol` es texto libre, no un enumerado: la referencia trae valores compuestos como
  `"Validador, Editar"`, que no encajan en un `enum`.
- `rol` y `superadmin` son conceptos separados en la referencia (`User_TO` tiene
  `rol = "Validador, Editar"` y `Superadmin = yes`), así que son dos columnas y no una sola.
- La columna `Costo` de la referencia viene vacía en las 10 filas: es residuo de la plantilla de
  kits, y **no** se replica.
- Con un solo usuario la paginación no se ejercita con datos reales (misma brecha que en
  módulos de salud).

## Pruebas esperadas
### Unitarias
- `escapeLike()` escapa `%` y `_`.
### Integración
- Consulta a SQLite con filtro OR, orden y paginación.
- Las props no incluyen `password`.
### E2E
- N/A: no hay suite automatizada. La evidencia prevista era un script de humo descartable, que
  **no se ejecutó** por indicación del usuario: la verificación fue la revisión manual en el
  navegador más `codegen`, `lint` y `typecheck` en verde.

## Dependencias
- `app/models/user.ts` y la sesión por magic link (FEATURE-002).
- La migración de `users` que añade las 3 columnas.

## Riesgos
- La migración altera el esquema de la base de autenticación: si `down()` se ejecuta sobre una base
  con datos, se pierden los valores de `area`, `rol` y `superadmin`.
- Mostrar el listado expone el correo de todos los usuarios a cualquiera autenticado. No es un
  cambio de exposición (la maqueta ya los mostraba), pero sí lo consolida.
- Borrar los usuarios de prueba de `tmp/db.sqlite3` es **irreversible y local**: ese archivo está
  gitignored, así que la limpieza no viaja en el commit.
- **El escapado de comodines depende de una cláusula que SQLite no da por defecto**: sin
  `ESCAPE '\'` el buscador no filtra como se espera y podría devolver más filas de las que
  corresponden. Ya está corregido y medido, pero es una trampa fácil de reintroducir al tocar el
  filtro.

## Ready for Development
- [x] Requirement definido.
- [x] Reglas de negocio identificadas.
- [x] Impacto en datos definido.
- [x] API definida.
- [x] Permisos definidos.
- [x] UX/UI disponible (`Plantillas/usuarios/`).
- [x] Criterios de aceptación verificables.
- [x] Dependencias y riesgos visibles.
- [x] Decisiones bloqueantes resueltas.

### Decisiones bloqueantes resueltas en esta sesión
- **Columnas**: 5 (`Nombre`, `Correo`, `Area`, `Rol`, `Superadmin`), decididas por el usuario
  siguiendo la referencia. Se descarta `Costo` por venir vacía en las 10 filas.
- **Campos que faltaban**: `users` solo tenía `id`, `full_name`, `email`, `password`,
  `created_at` y `updated_at`. Se añaden `area` y `rol` (texto) y `superadmin` (booleano).
- **`superadmin` como columna propia** (opción A del usuario): la referencia trata el rol y el flag
  como conceptos separados, así que son dos columnas y no una derivada de `rol`.
- **Buscador**: una sola caja que busca en `full_name` **o** `email`, con `ESCAPE '\'` explícito
  porque SQLite no escapa el backslash por defecto (PostgreSQL sí).
- **Valores del usuario existente**: `area = 'TO'`, `rol = 'Superadmin'`, `superadmin = true`.
- **Datos de prueba**: se borran los 17 usuarios de prueba (`verify-*`, `dbg-*`, `smoke@*`) que
  dejaron scripts de humo, y queda solo el usuario real.
- **Escritura**: sigue sin decidirse quién da de alta usuarios. El modal y el menú de
  editar/eliminar quedan de maqueta.
- **Conexión**: SQLite, no Supabase. Es la única fuente de usuarios y es la que usa la
  autenticación; además es local, así que no aplica `withConnectionRetry()`.

## Definition of Done
- [x] Implementación completa (migración, modelo, controller, ruta y página; `codegen`, `lint` y
      `typecheck` en verde).
- [ ] Pruebas aprobadas - **pendiente de la revisión manual del usuario**. No se ejecutó el humo
      HTTP por indicación suya, así que los `TC-USR-*` siguen sin ejecutar.
- [ ] Code Review aprobado - **no formalizado**: no hay proceso de review en el repositorio.
- [ ] CI aprobado - **no disponible: el proyecto no tiene CI** (brecha).
- [x] API/BD/docs actualizados (`01-requirements`, `02-functional-design`, `03-architecture`,
      `04-database`, `05-api`, `06-security`, `08-quality`, `features/`, `docs/README.md` y
      `AGENTS.md`).
- [ ] QA/UAT completado - **no aplica: no hay ambiente de pruebas**.

## Brechas
- El modal "Nuevo usuario" y el menú de editar/eliminar son maqueta: **no hay ruta que escriba ni
  borre usuarios**. La pregunta más urgente del proyecto ("¿quién da de alta a los usuarios?")
  sigue sin respuesta.
- `area`, `rol` y `superadmin` son **datos de pantalla**: nada en el servidor los lee para
  autorizar. `middleware.auth()` sigue siendo el único control, así que cualquier usuario
  autenticado ve el catálogo completo.
- El listado expone el correo de todos los usuarios a cualquiera con sesión.
- Solo hay 1 usuario, así que la paginación no se ejercita más allá de la página 1.
- Sin cobertura automatizada: los `TC-USR-*` están escritos pero no ejecutados, y el humo HTTP no
  corrió, así que no hay evidencia reproducible de esta pantalla.
- La limpieza de los usuarios de prueba no queda en el repositorio (`tmp/db.sqlite3` es
  gitignored): en otro entorno habría que repetirla.