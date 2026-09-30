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
| `SKU` | SKUs | `/skus` | Maqueta | RF-SKU-001 *reservado* | FEATURE-003 `DRAFT` |
| `FAM` | Familias | `/familias` | Maqueta | RF-FAM-001 *reservado* | FEATURE-004 `DRAFT` |
| `KIT` | Kits de insumos | `/kits` | Real | RF-KIT-001…006 | FEATURE-005 `READY` |
| `USR` | Usuarios | `/usuarios` | Maqueta | RF-USR-001 *reservado* | FEATURE-006 `DRAFT` |
| `ZON` | Zonas | `/zonas` | Maqueta | RF-ZON-001 *reservado* | FEATURE-007 `DRAFT` |
| `MSD` | Módulos de salud | `/modulos-de-salud` | Maqueta | RF-MSD-001 *reservado* | FEATURE-008 `DRAFT` |

## Por qué no hay requisitos

| Motivo | Evidencia |
|---|---|
| Las páginas importan arrays literales desde el propio `.tsx` | `inertia/pages/skus.tsx`, `familias.tsx`, `zonas.tsx`, `modulos_de_salud.tsx`, `usuarios.tsx` |
| No hay modelo Lucid para ninguno | `app/models/` tiene `user.ts`, `magic_link.ts`, `insumo.ts`, `kit.ts` |
| No hay migración que cree sus tablas | `database/migrations/` solo tiene `users` y `magic_links` |
| No hay controller | `app/controllers/` tiene `insumos`, `kits`, `magic_link`, `new_account`, `session` |
| Los buscadores y la paginación son controles sin comportamiento | Solo `/insumos` y `/kits` conectan su `onKeyDown` y su paginación |
| No hay reglas de negocio conocidas | No existe un documento de negocio en el repositorio |

## Qué hay que saber para especificar cada módulo

Preguntas bloqueantes. Mientras no se respondan, el requisito no se puede redactar.

### `SKU` · FEATURE-003

| # | Pregunta |
|---|---|
| 1 | ¿El SKU se guarda en Supabase o en la base de datos de la aplicación? Hoy el catálogo es externo y de solo lectura (ADR-004) |
| 2 | ¿Qué diferencia un SKU de un insumo? ¿Un SKU es un insumo con variantes (medida, presentación)? |
| 3 | ¿Quién lo crea y quién lo edita? No hay roles (ver [roles y permisos](../06-security/roles-permissions.md)) |
| 4 | ¿Qué columnas tiene? Sin esto, `app/models/sku.ts` no se puede escribir |
| 5 | ¿Qué significan exactamente "Familias", "Kits" y "Zonas" en este negocio? El [glosario](../00-project/glossary.md) lo deja como provisional |

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

| # | Pregunta |
|---|---|
| 1 | **¿Quién da de alta a los usuarios?** Hoy el magic link exige un `User` previo y no hay interfaz de gestión. Es la pregunta más urgente del proyecto |
| 2 | ¿La lista es de usuarios de la clínica o de contactos comerciales? |
| 3 | ¿Un usuario puede tener rol? Hoy no hay columna de rol |
| 4 | ¿Se puede dar de baja a alguien? Sin proceso de baja, las cuentas se acumulan |
| 5 | ¿Quién ve esta pantalla: todos los autenticados? Con el control binario actual, sí |

### `ZON` · FEATURE-007

| # | Pregunta |
|---|---|
| 1 | ¿Una zona es geográfica (sucursal, ciudad) o de catálogo (tipo de zona clínica)? |
| 2 | ¿Un insumo se asigna a zonas de forma fija o por reglas? |
| 3 | ¿Las zonas filtran el catálogo de insumos? Si es así, `/insumos` necesita un parámetro nuevo |

### `MSD` · FEATURE-008

| # | Pregunta |
|---|---|
| 1 | ¿Qué es un "módulo de salud" en este negocio: especialidad, servicio o línea de producto? |
| 2 | ¿Se relaciona con las familias o es un eje independiente? |
| 3 | ¿El HTML de `Plantillas/modulos de salud/` resuelve alguna de estas preguntas? No: son páginas estáticas |

### Transversal a los módulos sin datos

| # | Pregunta |
|---|---|
| 1 | ¿Dónde viven los datos: en Supabase o en una base nueva de la aplicación? |
| 2 | ¿Quién puede escribir? Sin roles no hay respuesta |
| 3 | ¿Se necesita `Plantillas/` de SKUs e Insumos? Hoy faltan, y son las dos pantallas más importantes |
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

- **Cinco de ocho módulos de dominio sin requisito** (`SKU`, `FAM`, `USR`, `ZON`, `MSD`): la brecha
  está declarada y con su causa identificada, no cerrada de hecho. `KIT` dejó de estar aquí: tiene
  tabla, requisitos y lectura real, aunque su escritura sigue sin decidir.
- **La pregunta sobre quién da de alta usuarios está sin respuesta desde el primer día**: sin ella,
  el producto no es utilizable por nadie ajeno a quien mantiene la base de datos.
- **No hay documento de negocio**: todas las preguntas de este documento llevan a la misma raíz, que
  no es técnica.
- **`Plantillas/` está incompleta**: faltan las referencias de SKUs e Insumos, las dos pantallas más
  importantes. Sin ellas, la fidelidad visual de esas secciones no se puede verificar.
- **Los requisitos reservados son un solo ID por módulo**: cuando se aborden, habrá que asignar
  varios (`RF-SKU-001`, `RF-SKU-002`…), no encajar todo en uno.
