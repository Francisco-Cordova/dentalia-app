# Módulos sin requisitos

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | `7bb5ecb` |

## Propósito

Este documento **cierra la brecha** que el índice señalaba como "falta el resto de módulos", sin
inventar requisitos. Los módulos restantes **no se especifican aquí porque no se pueden
especificar**: sus pantallas existen, pero no hay sistema detrás del que derivar comportamiento.

Escribir un requisito para "buscar un SKU" cuando el buscador no consulta nada sería documentar una
funcionalidad inexistente. Lo honesto es registrar el identificador reservado, declarar la ausencia
y listar **qué hace falta saber** para poder especificarlas.

## Estado de los requisitos por módulo

| Código | Módulo | Ruta | Pantalla | Requisitos | Feature |
|---|---|---|---|---|---|
| `AUT` | Autenticación | `/`, `/signup`, `/auth/magic/:token` | Real | RF-AUT-001…003 | FEATURE-002 `DONE` |
| `INS` | Catálogo de insumos | `/insumos` | Real | RF-INS-001…005 | FEATURE-001 `DONE` |
| `SKU` | SKUs | `/skus` | Real | RF-SKU-001…004 | FEATURE-003 `DONE` |
| `FAM` | Familias | `/familias` | Maqueta | RF-FAM-001 *reservado* | FEATURE-004 `DRAFT` |
| `KIT` | Kits de insumos | `/kits` | Real | RF-KIT-001…006 | FEATURE-005 `DONE` |
| `USR` | Usuarios | `/usuarios` | Real | RF-USR-001…003 | FEATURE-006 `UAT` |
| `ZON` | Zonas | `/zonas` | Real | RF-ZON-001…003 | FEATURE-007 `DONE` |
| `MSD` | Módulos de salud | `/modulos-de-salud` | Real | RF-MSD-001…003 | FEATURE-008 `DONE` |

## Por qué no hay requisitos

| Motivo | Evidencia |
|---|---|
| Las páginas importan arrays literales desde el propio `.tsx` | `inertia/pages/familias.tsx` (a `skus.tsx` le sobró al pasar a datos reales el 2026-10-02) |
| No hay modelo Lucid para ninguno | `app/models/` tiene `user.ts`, `magic_link.ts`, `insumo.ts`, `kit.ts`, `zona.ts`, `modulos_salud.ts`, `sku.ts` |
| No hay migración que cree sus tablas | `database/migrations/` tiene `users`, `magic_links` y el añadido de `area`/`rol`/`superadmin` |
| No hay controller | `app/controllers/` tiene `insumos`, `kits`, `zonas`, `modulos_salud`, `usuarios`, `skus`, `magic_link`, `new_account`, `session` |
| Los buscadores y la paginación son controles sin comportamiento | Solo `/insumos`, `/kits`, `/zonas`, `/modulos-de-salud`, `/usuarios` y `/skus` conectan su `onKeyDown` y su paginación |
| No hay reglas de negocio conocidas | No existe un documento de negocio en el repositorio |

## Qué hay que saber para especificar cada módulo

Preguntas bloqueantes. Mientras no se respondan, el requisito no se puede redactar.

### `SKU` · FEATURE-003

[FEATURE-003](../features/FEATURE-003-skus.md) cubre el listado real desde `dev."SKU"`. Las
preguntas quedan así:

| # | Pregunta | Estado |
|---|---|---|
| 1 | ¿El SKU se guarda en Supabase o en la base de datos de la aplicación? | **Respondida (parcial).** Vive en Supabase, en el esquema `dev`, tabla `dev."SKU"` (255 filas, solo lectura, igual que ADR-004). No hay tabla equivalente en SQLite |
| 2 | ¿Qué diferencia un SKU de un insumo? | **Abierta.** La tabla sugiere que un SKU es un *tratamiento* del catálogo (tiene `"Precio Nacional"`, `"Precio Turista"`, comisiones y márgenes) que consume una lista de insumos en la columna de texto `"Insumos"`, mientras que `dev."Insumos"` es el artículo de inventario con cantidad y costo unitario. Nadie lo ha confirmado |
| 3 | ¿Quién lo crea y quién lo edita? | **Abierta.** No hay roles (ver [roles y permisos](../06-security/roles-permissions.md)); `middleware.auth()` sigue siendo el único control |
| 4 | ¿Qué columnas tiene? | **Respondida.** 25 columnas, majorityúsculas y con espacios; ver la sección de datos de [FEATURE-003](../features/FEATURE-003-skus.md). La pantalla solo usa 4 |
| 5 | ¿Qué significan exactamente "Familias", "Kits" y "Zonas" en este negocio? | **Abierta.** Para SKUs se añadió que `Familia`, `Especialidad` y `Módulo de salud` **no son derivables**: no hay columna ni FK, y `public.familias` y `public.especialidades` tienen 0 filas. Quedan como dummy `—` |

Preguntas nuevas que dejó la implementación:

| # | Pregunta | Estado |
|---|---|---|
| 6 | ¿La etiqueta "Ultima actualización 14/07 10:59" del pie corresponde a este catálogo? | **Abierta.** El usuario respondió que "esa etiqueta es de otra cosa" y se mantiene como dummy, pero `dev."SKU"."created_at"` sí existe (2025-09-18 a 2026-09-28) y se podría mostrar real |
| 7 | ¿Debe la tabla mostrar la información financiera del SKU? | **Abierta.** Precios, comisiones y márgenes están en la tabla y no se muestran; además solo **34 de 255 filas** tienen `"Precio Nacional"` distinto de cero, así que hoy se verían casi todas en `$0.00` |
| 8 | ¿Debe mostrarse el conteo de insumos o kits por SKU? | **Abierta.** Se podría contar vía `public."Insumos_SKU"` (1,904 filas, 150 SKUs) y `public.kit_sku` (1,179 filas, 209 SKUs), ambos con FK a `public."SKU"."ID tratamiento"`. El usuario decidió no agregarlas |

### `FAM` · FEATURE-004

| # | Pregunta |
|---|---|
| 1 | ¿Una familia agrupa insumos por criterio funcional (higiene, quirúrgico) o comercial (marca, línea)? |
| 2 | ¿Tiene jerarquía? ¿Una familia contiene subfamilias? |
| 3 | ¿Un insumo pertenece a una familia, a varias, o a ninguna? |

### `KIT` · FEATURE-005

Estas preguntas ya no bloquean la lectura del catálogo: `dev."Kits"` existe en Supabase y
[FEATURE-005](../features/FEATURE-005-kits-de-insumos.md) cubre el listado. Dos quedaron
respondidas por el propio dato:

| # | Pregunta | Estado |
|---|---|---|
| 1 | ¿Un kit es una lista de insumos con cantidad fija, o un producto con precio propio? | **A medias.** `dev."Kits"."Insumos"` guarda códigos sueltos, sin cantidad. La cantidad por insumo solo existe en `public."Kits"."Cantidad requerida numero"`, que la app aún no consulta |
| 2 | ¿El precio del kit se calcula sumando los componentes o se define aparte? | **Respondida: se define aparte.** `Costo` es una columna `real` almacenada e independiente de la lista de insumos |
| 3 | ¿Cambiar el precio de un insumo cambia el del kit? | **Abierta.** El dato sugiere que no (el costo está desacoplado), pero es una decisión de negocio |

Lo que sigue pendiente para `KIT` es la **escritura**: quién crea kits, si habrá edición, y qué
tabla relaciona cada kit con sus insumos y en qué cantidad.

### `USR` · FEATURE-006

La lectura del catálogo ya no está bloqueada: los usuarios son las filas de `users` (SQLite, la misma
tabla de la autenticación) y [FEATURE-006](../features/FEATURE-006-usuarios.md) cubre el listado.
Las preguntas quedan así:

| # | Pregunta | Estado |
|---|---|---|
| 1 | ¿Quién da de alta a los usuarios? | **Abierta.** El magic link exige un `User` previo y no hay interfaz de gestión: el modal "Nuevo usuario" sigue siendo maqueta. Es la pregunta más urgente del proyecto |
| 2 | ¿La lista es de usuarios de la clínica o de contactos comerciales? | **Abierta.** Hoy solo se lee `users`, que es la tabla de autenticación |
| 3 | ¿Un usuario puede tener rol? | **Parcialmente respondida.** `users` ya tiene `rol` (texto) y `superadmin` (booleano), pero los añadió la migración para poder mostrar la referencia de diseño, y **nada en el servidor los lee para autorizar**. La matriz de permisos sigue sin existir |
| 4 | ¿Se puede dar de baja a alguien? | **Abierta.** Sin proceso de baja, las cuentas se acumulan: hoy se ven 18 filas en `users` porque los scripts de humo dejaron usuarios de prueba |
| 5 | ¿Quién ve esta pantalla: todos los autenticados? | **Sí, de hecho.** Con el control binario actual todos los autenticados la ven, y el listado expone el correo de todos |

Lo que sigue pendiente para `USR` es la **escritura**: quién crea cuentas, quién las edita y quién las
desactiva.

### `ZON` · FEATURE-007

La lectura del catálogo ya no está bloqueada: `dev."zonas"` y `public.clinicas_zonas` existen en
Supabase y [FEATURE-007](../features/FEATURE-007-catalogo-zonas.md) cubre el listado. Las
preguntas quedan así:

| # | Pregunta | Estado |
|---|---|---|
| 1 | ¿Una zona es geográfica (sucursal, ciudad) o de catálogo (tipo de zona clínica)? | **Abierta.** El dato sugiere de catálogo: solo hay `Turista` y `Nacional`, cada una con clínicas asignadas en `public.clinicas_zonas` |
| 2 | ¿Un insumo se asigna a zonas de forma fija o por reglas? | **Abierta.** Hoy no hay tabla que relacione insumos con zonas |
| 3 | ¿Las zonas filtran el catálogo de insumos? Si es así, `/insumos` necesita un parámetro nuevo | **Abierta.** Decisión de negocio |

Lo que sigue pendiente para `ZON` es la **escritura**: quién crea zonas y quién asigna clínicas a
cada zona (hoy `public.clinicas_zonas` se lee, pero nadie escribe desde la app).

### `MSD` · FEATURE-008

La lectura del catálogo ya no está bloqueada: `dev.modulos_salud` existe en Supabase y
[FEATURE-008](../features/FEATURE-008-modulos-de-salud.md) cubre el listado. Las preguntas quedan
así:

| # | Pregunta | Estado |
|---|---|---|
| 1 | ¿Qué es un "módulo de salud" en este negocio: especialidad, servicio o línea de producto? | **Abierta.** El dato sugiere especialidad: `PERIODONCIA`, `ORTODONCIA`, `ENDODONCIAS`, `CORONAS / PROSTODONCIA`, `DIAGNOSTICO Y PREVENCION`, `ESTETICO`. Es el mismo tipo de palabra que las zonas activas |
| 2 | ¿Se relaciona con las familias o es un eje independiente? | **Abierta.** No hay ninguna tabla que relacione módulos con familias ni con insumos |
| 3 | ¿Cuántos SKUs tiene cada módulo? | **Bloqueada por el dato.** Es la columna "SKU" de la pantalla, hoy con un **0 dummy**: `public."SKU"` (255 filas) no tiene columna ni FK hacia módulos, así que no hay forma de contarlos. Nadie ha decidido si la relación debe existir o si el conteo se calcula de otra forma |
| 4 | ¿El HTML de `Plantillas/modulos de salud/` resuelve alguna de estas preguntas? | **No.** Solo resuelve el diseño: 3 columnas (`Nombre`, `SKU`, `Opciones`), con el número de SKUs bajo "SKU" y el botón trash bajo "Opciones" |

Lo que sigue pendiente para `MSD` es la **escritura**: quién crea módulos de salud y qué relación
habrá entre un módulo y sus SKUs.

### Transversal a los módulos sin datos

| # | Pregunta |
|---|---|
| 1 | ¿Dónde viven los datos: en Supabase o en una base nueva de la aplicación? |
| 2 | ¿Quién puede escribir? Sin roles no hay respuesta |
| 3 | ¿Se necesita `Plantillas/` de SKUs, Insumos y Familias? | **Respondida para SKUs: no hay y no habrá referencia.** El usuario confirmó (2026-10-02) que el sitio de Dentalia cambió de estructura, así que la maqueta ya construida de `/skus` fue la fuente de verdad del diseño. Siguen faltando Insumos y Familias |
| 4 | ¿El flujo de alta exige verificación de correo, como sí hace `POST /signup`? |

## Criterio para reabrir esta brecha

Un módulo sale de aquí cuando cumple **todas** estas condiciones:

- [ ] Las preguntas bloqueantes del módulo están respondidas por alguien del negocio
- [ ] Existe `RF-<MÓDULO>-001` redactado en [functional-requirements.md](functional-requirements.md)
- [ ] Existe al menos un criterio `AC-<MÓDULO>-001` en [acceptance-criteria.md](acceptance-criteria.md)
- [ ] Existe su flujo en [flows/](../02-functional-design/flows/)
- [ ] Existe la feature con estado `READY` en [features/](../features/README.md)

Mientras tanto, la regla de `features/README.md` sigue aplicando: **no implementar una feature en
`DRAFT`**.

## Referencias
- [Funcional design: módulos](../02-functional-design/modules.md)
- [Funcional: roles](../02-functional-design/user-roles.md)
- [Flujos](../02-functional-design/flows/README.md)
- [Features reservadas](../features/README.md)
- [Alcance](../00-project/scope.md)
- [Roles y permisos](../06-security/roles-permissions.md)

## Brechas

- **Uno de ocho módulos de dominio sin requisito** (`FAM`): la brecha está declarada y con su causa
  identificada, no cerrada de hecho. `SKU` dejó de estar aquí el 2026-10-02 (FEATURE-003 `DONE`
  con lectura real de `dev."SKU"`); `KIT`, `ZON`, `MSD` y `USR` también tienen tabla, requisitos y
  lectura real, aunque su escritura sigue sin decidir.
- **La pregunta sobre quién da de alta usuarios está sin respuesta desde el primer día**: sin ella,
  el producto no es utilizable por nadie ajeno a quien mantiene la base de datos. Lo mismo aplica
  al alta de SKUs.
- **No hay documento de negocio**: todas las preguntas de este documento llevan a la misma raíz, que
  no es técnica.
- **`Plantillas/` está incompleta y para SKUs es irrelevante**: faltan las referencias de Insumos y
  Familias, y el usuario confirmó que la de SKUs ya no existe porque el sitio cambió de estructura.
  En `/skus` eso dejó 5 columnas sin origen verificable (ver FEATURE-003).
- **`/skus` se implementó sin plantilla** y con 5 de 7 columnas dummy: si más adelante aparece el
  HTML real, hay que revalidar las cabeceras y los 3 buscadores.
