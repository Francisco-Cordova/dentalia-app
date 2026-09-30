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
| [00-project/](00-project/) | ANALYZED — brief, alcance, glosario y stakeholders reconstruidos a partir del código; sin validación de negocio |
| [01-requirements/](01-requirements/) | ANALYZED — RF/BR/AC de `AUT`, `INS` y `KIT` redactados; los otros 5 módulos registrados en [modulos-pendientes.md](01-requirements/modulos-pendientes.md) con sus preguntas bloqueantes |
| [02-functional-design/](02-functional-design/) | ANALYZED — módulos, roles y 3 flujos; los 5 módulos restantes no tienen flujo porque no tienen comportamiento |
| [03-architecture/](03-architecture/) | ANALYZED — contexto, contenedores, integraciones, vista de arquitectura y 6 ADR |
| [04-database/](04-database/) | ANALYZED — diseño, diccionario, ER, migraciones y respaldo |
| [05-api/](05-api/) | ANALYZED — frontera Inertia (no hay API REST); contratos, errores y guías |
| [06-security/](06-security/) | ANALYZED — 34 requisitos (SEC-001..SEC-034), auth, autorización, auditoría, datos, roles y secretos |
| [07-development/](07-development/) | ANALYZED — entorno, guías, git, estándares, DoD y checklist |
| [08-quality/](08-quality/) | ANALYZED — estrategia, casos y niveles de prueba; sin automatización implementada |
| [09-infrastructure/](09-infrastructure/) | ANALYZED — no existe infraestructura; infraestructura, ambientes, deployment, backup, DR y monitoreo documentados como inventario de lo ausente |
| [10-operations/](10-operations/) | ANALYZED — sin proceso de incidentes; runbook y troubleshooting derivados del código, con rollback sin probar |
| [features/](features/) | ANALYZED — FEATURE-001 y FEATURE-002 en `DONE` sin UAT; FEATURE-005 en `READY`; FEATURE-003, 004, 006…008 reservadas |

## Estados de trabajo

`DRAFT → ANALYZED → READY → IN DEVELOPMENT → CODE REVIEW → QA → UAT → DONE`

## Método: as-built, no as-designed

Cada documento describe **lo que el código hace**, verificado. Lo que el sistema *debería* hacer y
no hace está en la sección `## Brechas` de cada documento, nunca en el cuerpo como si estuviera
implementado.

| Regla | Por qué |
|---|---|
| Nada de requisitos, cifras ni capacidades inventadas | Un documento que describe un sistema inexistente es peor que uno vacío |
| Las brechas van declaradas, no disimuladas | Son la información más útil de esta documentación |
| Un documento de plantilla se rellena o se explica por qué no | No se dejan plantillas a medio hacer |

### Estado real del proyecto, en una frase

El panel funciona con autenticación por enlace mágico verificada, y solo dos secciones tienen
fuente de datos real —el catálogo de insumos y el de kits—; las otras cinco son maquetas; y no
existe infraestructura, despliegue, pruebas ni proceso de incidentes.

### Lo que sigue pendiente, en orden

| Prioridad | Pendencia | Dónde está documentada |
|---|---|---|
| 1 | Decidir quién da de alta a los usuarios | [stakeholders.md](00-project/stakeholders.md) · [modulos-pendientes.md](01-requirements/modulos-pendientes.md) |
| 2 | Definir dónde viven los datos de SKU, familias, zonas y módulos de salud | [modulos-pendientes.md](01-requirements/modulos-pendientes.md) |
| 2b | Definir quién escribe kits y qué tabla relaciona cada kit con sus insumos | [FEATURE-005](features/FEATURE-005-kits-de-insumos.md) |
| 3 | Decidir si el autoregistro de `POST /signup` es funcionalidad o residuo | [scope.md](00-project/scope.md) |
| 4 | Resolver el bloqueo de infraestructura: `tmp/db.sqlite3` impide desplegar | [environments.md](09-infrastructure/environments.md) |
| 5 | Respaldar `tmp/db.sqlite3`, hoy irrecuperable | [backup-policy.md](09-infrastructure/backup-policy.md) |
| 6 | Escribir el primer test: la lógica con más riesgo es `escapeLike()` | [test-strategy.md](08-quality/test-strategy.md) |
| 7 | Capturar las plantillas de SKUs e Insumos | [features/README.md](features/README.md) |
| 8 | Validar el alcance con negocio | [product-brief.md](00-project/product-brief.md) |

## Cobertura documental

| Sección | Documentos | Con `## Brechas` |
|---|---|---|
| `00-project` | 4 | 4 |
| `01-requirements` | 6 | 6 |
| `02-functional-design` | 5 | 5 |
| `03-architecture` | 4 + 6 ADR + plantilla | 4 |
| `04-database` | 6 | 4 |
| `05-api` | 5 | 5 |
| `06-security` | 7 | 5 |
| `07-development` | 6 | 4 |
| `08-quality` | 7 | 7 |
| `09-infrastructure` | 6 | 6 |
| `10-operations` | 4 | 4 |
| `features` | 4 | 4 |

Los documentos sin `## Brechas` son plantillas (`FLOW-000-template.md`, `ADR-000-template.md`,
`FEATURE-000-template.md`), los índices de sección y los ADR, que en su lugar tienen la sección
`## Revisión`.
