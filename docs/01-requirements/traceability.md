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
| [FEATURE-003](../features/FEATURE-003-skus.md) | RF-SKU-001 | BR-SKU-001, BR-SKU-003 | `GET /skus` | `dev."SKU"` | `sku:read` | AC-SKU-001, AC-SKU-002, AC-SKU-003, AC-SKU-004, AC-SKU-005, AC-SKU-006, AC-SKU-016 | DONE |
| [FEATURE-003](../features/FEATURE-003-skus.md) | RF-SKU-002 | BR-SKU-002 | `GET /skus?page=N` | `dev."SKU"` | `sku:read` | AC-SKU-012, AC-SKU-013, AC-SKU-014 | DONE |
| [FEATURE-003](../features/FEATURE-003-skus.md) | RF-SKU-003 | BR-SKU-006 | `GET /skus?nombre=...` | `dev."SKU"."Nombre"` | `sku:read` | AC-SKU-007, AC-SKU-011 | DONE |
| [FEATURE-003](../features/FEATURE-003-skus.md) | RF-SKU-004 | BR-SKU-002, BR-SKU-004 | `GET /skus?tratamiento=...`, `GET /skus?codigo=...` | `"ID tratamiento"`, `"ID SKU"` | `sku:read` | AC-SKU-008, AC-SKU-009, AC-SKU-010, AC-SKU-011 | DONE |
| FEATURE-004 (Familias) | RF-FAM-001 | BR-FAM-001 | `GET /familias` (mock) | `Plantillas/familias/` | `familias:read` | TC-PENDIENTE | DRAFT |
| [FEATURE-005](../features/FEATURE-005-kits-de-insumos.md) | RF-KIT-001 | BR-KIT-001, BR-KIT-005 | `GET /kits` | `dev."Kits"` | `kits:read` | AC-KIT-001, AC-KIT-008, AC-KIT-009 | DONE |
| [FEATURE-005](../features/FEATURE-005-kits-de-insumos.md) | RF-KIT-002 | BR-KIT-005, BR-KIT-007 | `GET /kits?page=N` | `dev."Kits"` | `kits:read` | AC-KIT-005 | DONE |
| [FEATURE-005](../features/FEATURE-005-kits-de-insumos.md) | RF-KIT-003 | BR-KIT-006 | `GET /kits?nombre=...` | `dev."Kits"."Nombre"` | `kits:read` | AC-KIT-002, AC-KIT-004, AC-KIT-006, AC-KIT-010, AC-KIT-011 | DONE |
| [FEATURE-005](../features/FEATURE-005-kits-de-insumos.md) | RF-KIT-004 | BR-KIT-006 | `GET /kits?codigo=...` | `dev."Kits"."ID_odoo"` | `kits:read` | AC-KIT-003, AC-KIT-010 | DONE |
| [FEATURE-005](../features/FEATURE-005-kits-de-insumos.md) | RF-KIT-005 | BR-KIT-002 | `GET /kits` | `dev."Kits"."Insumos"` | `kits:read` | AC-KIT-012 | DONE |
| [FEATURE-005](../features/FEATURE-005-kits-de-insumos.md) | RF-KIT-006 | BR-KIT-003, BR-KIT-004 | `GET /kits` | `Costo`, `ID_odoo` | `kits:read` | AC-KIT-013, AC-KIT-014 | DONE |
| [FEATURE-006](../features/FEATURE-006-usuarios.md) | RF-USR-001 | BR-USR-001, BR-USR-002, BR-USR-005 | `GET /usuarios` | `users` (SQLite) | `usuarios:read` | AC-USR-001, AC-USR-002, AC-USR-007, AC-USR-008 | UAT |
| [FEATURE-006](../features/FEATURE-006-usuarios.md) | RF-USR-002 | BR-USR-003 | `GET /usuarios?page=N` | `users` (SQLite) | `usuarios:read` | AC-USR-005 | UAT |
| [FEATURE-006](../features/FEATURE-006-usuarios.md) | RF-USR-003 | BR-USR-004 | `GET /usuarios?q=...` | `users.full_name`, `users.email` | `usuarios:read` | AC-USR-003, AC-USR-004, AC-USR-006, AC-USR-009, AC-USR-010 | UAT |
| [FEATURE-007](../features/FEATURE-007-catalogo-zonas.md) | RF-ZON-001 | BR-ZON-001, BR-ZON-005 | `GET /zonas` | `dev."zonas"`, `public.clinicas_zonas` | `zonas:read` | AC-ZON-001, AC-ZON-006, AC-ZON-008, AC-ZON-009, AC-ZON-010 | DONE |
| [FEATURE-007](../features/FEATURE-007-catalogo-zonas.md) | RF-ZON-002 | BR-ZON-003 | `GET /zonas?page=N` | `dev."zonas"` | `zonas:read` | AC-ZON-004 | DONE |
| [FEATURE-007](../features/FEATURE-007-catalogo-zonas.md) | RF-ZON-003 | BR-ZON-004 | `GET /zonas?nombre=...` | `dev."zonas"."nombre"` | `zonas:read` | AC-ZON-002, AC-ZON-003, AC-ZON-005, AC-ZON-007 | DONE |
| [FEATURE-008](../features/FEATURE-008-modulos-de-salud.md) | RF-MSD-001 | BR-MSD-001, BR-MSD-003 | `GET /modulos-de-salud` | `dev.modulos_salud` | `modulos:read` | AC-MSD-001, AC-MSD-006, AC-MSD-007, AC-MSD-008, AC-MSD-009 | DONE |
| [FEATURE-008](../features/FEATURE-008-modulos-de-salud.md) | RF-MSD-002 | BR-MSD-003 | `GET /modulos-de-salud?page=N` | `dev.modulos_salud` | `modulos:read` | AC-MSD-004 | DONE |
| [FEATURE-008](../features/FEATURE-008-modulos-de-salud.md) | RF-MSD-003 | BR-MSD-004 | `GET /modulos-de-salud?nombre=...` | `dev.modulos_salud.nombre` | `modulos:read` | AC-MSD-002, AC-MSD-003, AC-MSD-005 | DONE |

## Notas

- `FEATURE-004` (Familias) aparece con identificadores **reservados**; su documento se redactará al
  abrirla. El requisito `RF-FAM-001` y la regla `BR-FAM-001` de esa fila son marcadores de posición,
  no requisitos redactados.
- `FEATURE-003` (SKUs) ya no está reservada: pasó de `DRAFT` a `READY` el 2026-10-02, con
  `RF-SKU-001…004`, `BR-SKU-001…007` y `AC-SKU-001…017` redactados en
  [`FEATURE-003-skus.md`](../features/FEATURE-003-skus.md). Está en `DONE` desde el 2026-10-02:
  implementación completa, revisión visual del usuario en el navegador y humo HTTP del filtro con
  31/31 checks en verde, los 17 AC cerrados. Solo queda `TC-SKU-012` (el Enter del formulario)
  porque es comportamiento de cliente. La columna `Test` lista los AC que tienen caso de prueba en
  [08-quality/test-cases.md](../08-quality/test-cases.md); el estado de cada AC está en la feature.
- **Estados corregidos el 2026-10-02** al revisar `FEATURE-003`: `FEATURE-005` (kits),
  `FEATURE-007` (zonas) y `FEATURE-008` (módulos de salud) pasaron de `READY` a `DONE`, porque sus
  AC ya estaban cerrados y `Pruebas aprobadas` figuraba marcado desde que se implementaron. Sus
  19 filas en esta tabla se actualizaron en la misma pasada. `FEATURE-006` (usuarios) queda en
  `UAT`: está implementada y commiteada, pero sus 10 AC siguen sin marcar porque falta la revisión
  manual del usuario. `FEATURE-001` y `FEATURE-002` ya estaban en `DONE`.
- La columna `Test` referencia criterios de aceptación mientras no exista suite automatizada. La
  columna `API` referencia la ruta HTTP cuando la página es real y se marca `(mock)` cuando la
  ruta solo renderiza datos de maqueta.
- Ninguna fila tiene cobertura automatizada: los `AC-*` se validan con scripts de humo
  descartables, no con tests versionados.

## Brechas

- No existe una columna para los documentos transversales (arquitectura, BD, seguridad); hoy se cruzan solo feature → requirement.
- El mapeo feature → archivo de código se mantiene de forma manual: conviene añadir la ruta del controller y de la página cuando existan.
