# Matriz de trazabilidad

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Ãšltima actualizaciÃ³n | 2026-09-30 |
| VersiÃ³n relacionada | 2278659, 5b4f99b |

| Feature | Requirement | Business Rule | API | Datos | Permiso | Test | Estado |
|---|---|---|---|---|---|---|---|
| [FEATURE-002](../features/FEATURE-002-autenticacion-magic-link.md) | RF-AUT-001 | BR-AUT-001, BR-AUT-002, BR-AUT-003, BR-AUT-004 | `POST /login/magic` | `users`, `magic_links` | pÃºblico | AC-AUT-001, AC-AUT-002, AC-AUT-003 | DONE |
| [FEATURE-002](../features/FEATURE-002-autenticacion-magic-link.md) | RF-AUT-002 | BR-AUT-002, BR-AUT-003, BR-AUT-005 | `GET /auth/magic/:token` | `magic_links`, `users` | pÃºblico | AC-AUT-004, AC-AUT-005 | DONE |
| [FEATURE-002](../features/FEATURE-002-autenticacion-magic-link.md) | RF-AUT-003 | BR-AUT-006 | `POST /logout` | `magic_links` (sesiÃ³n en cookie) | `sesion:delete` | AC-AUT-006, AC-AUT-007 | DONE |
| [FEATURE-001](../features/FEATURE-001-catalogo-insumos.md) | RF-INS-001 | BR-INS-001, BR-INS-003, BR-INS-004, BR-INS-006 | `GET /insumos` | `dev."Insumos"` | `insumos:read` | AC-INS-001, AC-INS-008, AC-INS-009 | DONE |
| [FEATURE-001](../features/FEATURE-001-catalogo-insumos.md) | RF-INS-002 | BR-INS-001 | `GET /insumos?page=N` | `dev."Insumos"` | `insumos:read` | AC-INS-005 | DONE |
| [FEATURE-001](../features/FEATURE-001-catalogo-insumos.md) | RF-INS-003 | BR-INS-002, BR-INS-005 | `GET /insumos?nombre=...` | `dev."Insumos"."NAME"` | `insumos:read` | AC-INS-002, AC-INS-004, AC-INS-006, AC-INS-010 | DONE |
| [FEATURE-001](../features/FEATURE-001-catalogo-insumos.md) | RF-INS-004 | BR-INS-002, BR-INS-005 | `GET /insumos?codigo=...` | `dev."Insumos"."DEFAULT_CODE"` | `insumos:read` | AC-INS-003, AC-INS-010 | DONE |
| [FEATURE-001](../features/FEATURE-001-catalogo-insumos.md) | RF-INS-005 | BR-INS-003 | `GET /insumos` | `CANTIDAD`, `UNIT_COST` | `insumos:read` | AC-INS-001 | DONE |
| FEATURE-003 (SKUs) | RF-SKU-001 | BR-SKU-001 | `GET /skus` (mock) | `Plantillas/` | `skus:read` | TC-PENDIENTE | DRAFT |
| FEATURE-004 (Familias) | RF-FAM-001 | BR-FAM-001 | `GET /familias` (mock) | `Plantillas/familias/` | `familias:read` | TC-PENDIENTE | DRAFT |
| FEATURE-005 (Kits) | RF-KIT-001 | BR-KIT-001 | `GET /kits` (mock) | `Plantillas/kits/` | `kits:read` | TC-PENDIENTE | DRAFT |
| FEATURE-006 (Usuarios) | RF-USR-001 | BR-USR-001 | `GET /usuarios` (mock) | `Plantillas/usuarios/` | `usuarios:read` | TC-PENDIENTE | DRAFT |
| FEATURE-007 (Zonas) | RF-ZON-001 | BR-ZON-001 | `GET /zonas` (mock) | `Plantillas/zonas/` | `zonas:read` | TC-PENDIENTE | DRAFT |
| FEATURE-008 (MÃ³dulos de salud) | RF-MSD-001 | BR-MSD-001 | `GET /modulos-de-salud` (mock) | `Plantillas/modulos de salud/` | `modulos:read` | TC-PENDIENTE | DRAFT |

## Notas

- Las features `FEATURE-003` a `FEATURE-008` aparecen con identificadores **reservados**; sus
  documentos se redactarÃ¡n al abrir cada una. Los requisitos `RF-*-001` y `BR-*-001` de esas
  filas son marcadores de posiciÃ³n, no requisitos redactados.
- La columna `Test` referencia criterios de aceptaciÃ³n mientras no exista suite automatizada. La
  columna `API` referencia la ruta HTTP cuando la pÃ¡gina es real y se marca `(mock)` cuando la
  ruta solo renderiza datos de maqueta.
- Ninguna fila tiene cobertura automatizada: los `AC-*` se validan con scripts de humo
  descartables, no con tests versionados.

## Brechas

- No existe una columna para los documentos transversales (arquitectura, BD, seguridad); hoy se cruzan solo feature â†’ requirement.
- El mapeo feature â†’ archivo de cÃ³digo se mantiene de forma manual: conviene aÃ±adir la ruta del controller y de la pÃ¡gina cuando existan.
