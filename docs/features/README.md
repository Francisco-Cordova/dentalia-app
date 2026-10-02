# Features

Una feature es la unidad implementable y trazable del trabajo.

## Estados
`DRAFT → ANALYZED → READY → IN DEVELOPMENT → CODE REVIEW → QA → UAT → DONE`

## Regla
El agente no debe implementar una feature en `DRAFT` o `ANALYZED`.

## Crear una feature
Copiar `FEATURE-000-template.md`, asignar ID y completar el checklist `Ready for Development`.

## Convenciones
- ID correlativo `FEATURE-<NNN>` con nombre en `kebab-case`.
- Documentar `Requirement relacionado` con `RF-[MÓDULO]-[NNN]` (ver
  [`docs/README.md`](../README.md#códigos-de-módulo)).
- Al marcar una feature `DONE`, sus filas deben existir en
  [`01-requirements/traceability.md`](../01-requirements/traceability.md) y los documentos
  citados deben estar actualizados.

## Features

| ID | Nombre | Estado | Requisitos |
|---|---|---|---|
| [FEATURE-001](FEATURE-001-catalogo-insumos.md) | Catálogo de insumos | DONE | RF-INS-001 … RF-INS-005 |
| [FEATURE-002](FEATURE-002-autenticacion-magic-link.md) | Autenticación por enlace mágico | DONE | RF-AUT-001 … RF-AUT-003 |
| [FEATURE-003](FEATURE-003-skus.md) | SKUs | DONE | RF-SKU-001 … RF-SKU-004 |
| FEATURE-004 | Familias | DRAFT | RF-FAM-001 (reservado) |
| [FEATURE-005](FEATURE-005-kits-de-insumos.md) | Kits de insumos | DONE | RF-KIT-001 … RF-KIT-006 |
| [FEATURE-006](FEATURE-006-usuarios.md) | Usuarios | UAT | RF-USR-001 … RF-USR-003 |
| [FEATURE-007](FEATURE-007-catalogo-zonas.md) | Catálogo de zonas | DONE | RF-ZON-001 … RF-ZON-003 |
| [FEATURE-008](FEATURE-008-modulos-de-salud.md) | Módulos de salud | DONE | RF-MSD-001 … RF-MSD-003 |

## Identificadores reservados

`FEATURE-004` (Familias) está **reservada**: el documento aún no existe. Se redactará copiando
`FEATURE-000-template.md` cuando se aborde el módulo, tomando como referencia de diseño el HTML
correspondiente en `Plantillas/`.

Para esa feature, la prioridad natural es: **convertir la pantalla maqueta en lectura real**,
empezando por los buscadores y la paginación, que hoy son controles sin comportamiento.

## Brechas

- `FEATURE-004` no tiene documento: no hay requisitos, criterios de aceptación ni flujo asociados
  hasta que se abra. Es la última pantalla que sigue en maqueta.
- `Plantillas/` no tiene el HTML de referencia de SKUs, Insumos ni Familias. El usuario confirmó
  (2026-10-02) que el sitio de Dentalia **cambió de estructura**, así que las referencias hay que
  recapturarlas. En FEATURE-003 eso obligó a tomar la maqueta existente como fuente de verdad del
  diseño, sin poder auditar las 7 cabeceras contra Dentalia.
- Las features `DONE` no tienen cobertura automatizada: su evidencia son scripts de humo
  descartables, no tests versionados.
- La regla "no implementar en `DRAFT` o `ANALYZED`" no está automatizada: depende de que cada
  sesión de trabajo lea esta tabla.
