# Matriz de trazabilidad

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2278659, 5b4f99b |

| Feature | Requirement | Business Rule | API | Datos | Permiso | Test | Estado |
|---|---|---|---|---|---|---|---|
| [FEATURE-002](../features/FEATURE-002-autenticacion-magic-link.md) | RF-AUT-001 | BR-AUT-001, BR-AUT-002, BR-AUT-003, BR-AUT-004 | `POST /login/magic` | `users`, `magic_links` | público | AC-AUT-001, AC-AUT-002, AC-AUT-003 | DONE |
| [FEATURE-002](../features/FEATURE-002-autenticacion-magic-link.md) | RF-AUT-002 | BR-AUT-002, BR-AUT-003, BR-AUT-005 | `GET /auth/magic/:token` | `magic_links`, `users` | público | AC-AUT-004, AC-AUT-005 | DONE |
| [FEATURE-002](../features/FEATURE-002-autenticacion-magic-link.md) | RF-AUT-003 | BR-AUT-006 | `POST /logout` | `magic_links` (sesión en cookie) | `sesion:delete` | AC-AUT-006, AC-AUT-007 | DONE |
| [FEATURE-001](../features/FEATURE-001-catalogo-insumos.md) | RF-INS-001 | BR-INS-001, BR-INS-003, BR-INS-004, BR-INS-006 | `GET /insumos` | `dev."Insumos"` | `insumos:read` | AC-INS-001, AC-INS-008, AC-INS-009 | DONE |
| [FEATURE-001](../features/FEATURE-001-catalogo-insumos.md) | RF-INS-002 | BR-INS-001 | `GET /insumos?page=N` | `dev."Insumos"` | `insumos:read` | AC-INS-005 | DONE |
| [FEATURE-001](../features/FEATURE-001-catalogo-insumos.md) | RF-INS-003 | BR-INS-002, BR-INS-005 | `GET /insumos?nombre=...` | `dev."Insumos"."NAME"` | `insumos:read` | AC-INS-002, AC-INS-004, AC-INS-006, AC-INS-010 | DONE |
| [FEATURE-001](../features/FEATURE-001-catalogo-insumos.md) | RF-INS-004 | BR-INS-002, BR-INS-005 | `GET /insumos?codigo=...` | `dev."Insumos"."DEFAULT_CODE"` | `insumos:read` | AC-INS-003, AC-INS-010 | DONE |
| [FEATURE-001](../features/FEATURE-001-catalogo-insumos.md) | RF-INS-005 | BR-INS-003 | `GET /insumos` | `CANTIDAD`, `UNIT_COST` | `insumos:read` | AC-INS-001 | DONE |
| FEATURE-003 (SKUs) | RF-SKU-001 | BR-SKU-001 | `GET /skus` (mock) | `Plantillas/` | `skus:read` | TC-PENDIENTE | DRAFT |
| FEATURE-004 (Familias) | RF-FAM-001 | BR-FAM-001 | `GET /familias` (mock) | `Plantillas/familias/` | `familias:read` | TC-PENDIENTE | DRAFT |
| [FEATURE-005](../features/FEATURE-005-kits-de-insumos.md) | RF-KIT-001 | BR-KIT-001, BR-KIT-005 | `GET /kits` | `dev."Kits"` | `kits:read` | AC-KIT-001, AC-KIT-008, AC-KIT-009 | READY |
| [FEATURE-005](../features/FEATURE-005-kits-de-insumos.md) | RF-KIT-002 | BR-KIT-005, BR-KIT-007 | `GET /kits?page=N` | `dev."Kits"` | `kits:read` | AC-KIT-005 | READY |
| [FEATURE-005](../features/FEATURE-005-kits-de-insumos.md) | RF-KIT-003 | BR-KIT-006 | `GET /kits?nombre=...` | `dev."Kits"."Nombre"` | `kits:read` | AC-KIT-002, AC-KIT-004, AC-KIT-006, AC-KIT-010, AC-KIT-011 | READY |
| [FEATURE-005](../features/FEATURE-005-kits-de-insumos.md) | RF-KIT-004 | BR-KIT-006 | `GET /kits?codigo=...` | `dev."Kits"."ID_odoo"` | `kits:read` | AC-KIT-003, AC-KIT-010 | READY |
| [FEATURE-005](../features/FEATURE-005-kits-de-insumos.md) | RF-KIT-005 | BR-KIT-002 | `GET /kits` | `dev."Kits"."Insumos"` | `kits:read` | AC-KIT-012 | READY |
| [FEATURE-005](../features/FEATURE-005-kits-de-insumos.md) | RF-KIT-006 | BR-KIT-003, BR-KIT-004 | `GET /kits` | `Costo`, `ID_odoo` | `kits:read` | AC-KIT-013, AC-KIT-014 | READY |
| FEATURE-006 (Usuarios) | RF-USR-001 | BR-USR-001 | `GET /usuarios` (mock) | `Plantillas/usuarios/` | `usuarios:read` | TC-PENDIENTE | DRAFT |
| FEATURE-007 (Zonas) | RF-ZON-001 | BR-ZON-001 | `GET /zonas` (mock) | `Plantillas/zonas/` | `zonas:read` | TC-PENDIENTE | DRAFT |
| FEATURE-008 (Módulos de salud) | RF-MSD-001 | BR-MSD-001 | `GET /modulos-de-salud` (mock) | `Plantillas/modulos de salud/` | `modulos:read` | TC-PENDIENTE | DRAFT |

## Notas

- Las features `FEATURE-003`, `FEATURE-004`, `FEATURE-006` a `FEATURE-008` aparecen con
  identificadores **reservados**; sus documentos se redactarán al abrir cada una. Los requisitos
  `RF-*-001` y `BR-*-001` de esas filas son marcadores de posición, no requisitos redactados.
- La columna `Test` referencia criterios de aceptación mientras no exista suite automatizada. La
  columna `API` referencia la ruta HTTP cuando la página es real y se marca `(mock)` cuando la
  ruta solo renderiza datos de maqueta.
- Ninguna fila tiene cobertura automatizada: los `AC-*` se validan con scripts de humo
  descartables, no con tests versionados.

## Brechas

- No existe una columna para los documentos transversales (arquitectura, BD, seguridad); hoy se cruzan solo feature → requirement.
- El mapeo feature → archivo de código se mantiene de forma manual: conviene añadir la ruta del controller y de la página cuando existan.
