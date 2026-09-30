# Flujos funcionales

Crear un archivo por flujo relevante. Incluir actor, precondiciones, flujo principal, alternos, errores y diagrama Mermaid/BPMN cuando ayude.

## Convención
`FLOW-[MÓDULO]-[NNN]` — códigos de módulo en [`docs/README.md`](../../README.md#códigos-de-módulo).

## Flujos documentados

| Flujo | Nombre | Requisitos | Estado |
|---|---|---|---|
| [FLOW-AUT-001](FLOW-AUT-001.md) | Acceso al panel mediante enlace de un solo uso | RF-AUT-001, RF-AUT-002, RF-AUT-003 | ANALYZED |
| [FLOW-INS-001](FLOW-INS-001.md) | Consultar el catálogo de insumos | RF-INS-001 … RF-INS-005 | ANALYZED |

## Pendientes de documentar

Al abrir la feature correspondiente: alta y edición de SKU (RF-SKU), alta de familia, alta de kit,
edición de usuarios, alta de zona, alta de módulo de salud, y el alta de cuenta (`POST /signup`),
que hoy existe como ruta activa sin verificación de correo.
