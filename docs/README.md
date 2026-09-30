# Documentación del sistema

Esta carpeta es la **fuente de verdad documental**. Los documentos deben evolucionar junto con el código.

| Sección | Pregunta que responde |
|---|---|
| [00 · Proyecto](00-project/) | ¿Qué problema resolvemos y cuál es el alcance? |
| [01 · Requerimientos](01-requirements/) | ¿Qué debe hacer y qué condiciones debe cumplir? |
| [02 · Diseño funcional](02-functional-design/) | ¿Cómo funcionan módulos, usuarios y flujos? |
| [03 · Arquitectura](03-architecture/) | ¿Cómo está construido y por qué? |
| [04 · Base de datos](04-database/) | ¿Cómo se modelan y gobiernan los datos? |
| [05 · API](05-api/) | ¿Cómo se comunican clientes e integraciones? |
| [06 · Seguridad](06-security/) | ¿Cómo protegemos acceso, datos y auditoría? |
| [07 · Desarrollo](07-development/) | ¿Cómo debe trabajar el equipo? |
| [08 · Calidad](08-quality/) | ¿Cómo demostramos que funciona correctamente? |
| [09 · Infraestructura](09-infrastructure/) | ¿Dónde y cómo se ejecuta? |
| [10 · Operación](10-operations/) | ¿Cómo se opera, recupera y atienden incidentes? |
| [Features](features/) | ¿Qué unidad concreta se implementará? |

## Códigos de módulo

| Código | Módulo |
|---|---|
| `AUT` | Autenticación |
| `INS` | Insumos (Catálogo) |
| `SKU` | SKUs |
| `FAM` | Familias |
| `KIT` | Kits de insumos |
| `USR` | Usuarios |
| `ZON` | Zonas |
| `MSD` | Módulos de salud |
| `ADM` | Administración / Shell |
| `INF` | Infraestructura / Soporte |

## Regla de fuente de verdad

- Diseño/documentación de BD: `docs/04-database/`
- Schema/migraciones/seeds ejecutables: `/database/`
- Explicación de API: `docs/05-api/` (frontera HTTP Inertia; OpenAPI: **pendiente, no existe** — N/A hasta que exista API REST)
- Contrato API: `/openapi/openapi.yaml` — **pendiente, no existe** (la app no expone API REST)
- Infraestructura ejecutable: `/infra/` — **pendiente, no existe**
- Instrucciones para agentes: `/AGENTS.md`

## Estado de documentación

| Documento | Estado |
|---|---|
| [00-project/](00-project/) | DRAFT |
| [01-requirements/](01-requirements/) | ANALYZED — RF/BR/AC de `AUT` e `INS` redactados; falta el resto de módulos |
| [02-functional-design/](02-functional-design/) | ANALYZED — módulos, roles y 2 flujos; faltan flujos de los módulos restantes |
| [03-architecture/](03-architecture/) | ANALYZED — contexto, contenedores, integraciones, vista de arquitectura y 6 ADR |
| [04-database/](04-database/) | ANALYZED — diseño, diccionario, ER, migraciones y respaldo |
| [05-api/](05-api/) | ANALYZED — frontera Inertia (no hay API REST); contratos, errores y guías |
| [06-security/](06-security/) | ANALYZED — 34 requisitos (SEC-001..SEC-034), auth, autorización, auditoría, datos, roles y secretos |
| [07-development/](07-development/) | ANALYZED — entorno, guías, git, estándares, DoD y checklist |
| [08-quality/](08-quality/) | ANALYZED — estrategia, casos y niveles de prueba; sin automatización implementada |
| [09-infrastructure/](09-infrastructure/) | DRAFT |
| [10-operations/](10-operations/) | DRAFT |
| [features/](features/) | ANALYZED — FEATURE-001 y FEATURE-002 en `DONE`; FEATURE-003…008 reservadas |

## Estados de trabajo

`DRAFT → ANALYZED → READY → IN DEVELOPMENT → CODE REVIEW → QA → UAT → DONE`
