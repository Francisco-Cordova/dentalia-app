# Flujos funcionales

Crear un archivo por flujo relevante. Incluir actor, precondiciones, flujo principal, alternos, errores y diagrama Mermaid/BPMN cuando ayude.

## Convención
`FLOW-[MÓDULO]-[NNN]` — códigos de módulo en [`docs/README.md`](../../README.md#códigos-de-módulo).

## Flujos documentados

| Flujo | Nombre | Requisitos | Estado |
|---|---|---|---|
| [FLOW-AUT-001](FLOW-AUT-001.md) | Acceso al panel mediante enlace de un solo uso | RF-AUT-001, RF-AUT-002, RF-AUT-003 | ANALYZED |
| [FLOW-INS-001](FLOW-INS-001.md) | Consultar el catálogo de insumos | RF-INS-001 … RF-INS-005 | ANALYZED |
| [FLOW-KIT-001](FLOW-KIT-001.md) | Consultar el catálogo de kits | RF-KIT-001 … RF-KIT-006 | ANALYZED |
| [FLOW-SKU-001](FLOW-SKU-001.md) | Consultar el catálogo de SKUs | RF-SKU-001 … RF-SKU-004 | ANALYZED |
| [FLOW-ZON-001](FLOW-ZON-001.md) | Consultar el catálogo de zonas | RF-ZON-001 … RF-ZON-003 | ANALYZED |
| [FLOW-MSD-001](FLOW-MSD-001.md) | Consultar el catálogo de módulos de salud | RF-MSD-001 … RF-MSD-003 | ANALYZED |
| [FLOW-USR-001](FLOW-USR-001.md) | Consultar el catálogo de usuarios | RF-USR-001 … RF-USR-003 | ANALYZED |

## Por qué no hay más flujos

Solo hay siete porque solo hay siete módulos con comportamiento. La otra pantalla (`FAM`) importa un
array literal desde el propio `.tsx`: sin modelo, sin migración y sin controller **no hay flujo que
documentar**, solo un render estático.

Documentar un "alta de familia" cuando no existe un modelo sería inventar funcionalidad. Las
preguntas que hay que responder para poder escribir esos flujos están en
[módulos sin requisitos](../../01-requirements/modulos-pendientes.md).

## Pendientes de documentar

Al abrir la feature correspondiente:

| Flujo previsto | Requisitos | Depende de |
|---|---|---|
| Alta y edición de SKU | RF-SKU-* | La lectura ya existe (FLOW-SKU-001). Falta decidir quién escribe SKUs y si el catálogo se administra desde esta app o fuera |
| Alta de familia | RF-FAM-* | Definir qué es una familia y su relación con los insumos |
| Alta de kit | RF-KIT-* | El precio ya se resolvió: es una columna almacenada, no se calcula. Falta decidir quién escribe y qué tabla relaciona cada kit con sus insumos |
| Detalle de SKU | RF-SKU-* | La acción por fila de `/skus` es maqueta: no hay ruta de detalle |
| Edición de usuarios | RF-USR-* | La lectura ya existe (FLOW-USR-001). Falta **decidir quién da de alta a los usuarios**: es el bloqueo principal |
| Alta de zona | RF-ZON-* | La lectura ya existe (FLOW-ZON-001). Falta decidir quién escribe zonas y quién asigna clínicas |
| Alta de módulo de salud | RF-MSD-* | La lectura ya existe (FLOW-MSD-001). Falta definir el concepto en el negocio y decidir quién escribe |
| Alta de cuenta (`POST /signup`) | RF-AUT-004 *no existe* | Ruta activa, no enlazada desde la UI, que autentica de inmediato sin verificar el correo |

## Plantilla

Usar [FLOW-000-template.md](FLOW-000-template.md) y renombrar a `FLOW-<MÓDULO>-<NNN>`. Registrar el
flujo en la tabla de arriba y en
[módulos sin requisitos](../../01-requirements/modulos-pendientes.md) cuando cierre su brecha.

## Brechas

- **Dos módulos sin flujo**: `SKU` y `FAM` no tienen flujo porque no tienen
  comportamiento, no porque falte documentación.
- **`POST /signup` no tiene flujo documentado ni requisito**: es una ruta activa que crea cuentas e
  inicia sesión sin verificar el correo, y no está enlazada desde la interfaz. Nadie ha decidido si
  es una funcionalidad o un residuo que debería eliminarse.
- **No hay flujo de recuperación**: no existe reset de contraseña ni gestión de sesión desde la
  interfaz.
- **No hay flujo de alta de usuario**: la brecha más urgente. El magic link exige un `User` previo y
  la única forma de crearlo es el seeder o el autoregistro no enlazado.
- **Sin diagrama de estados de la sesión**: los tres estados (sin sesión, con sesión, enlace
  consumido) solo están implícitos en el middleware.
