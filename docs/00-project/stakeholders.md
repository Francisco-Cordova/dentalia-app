# Stakeholders

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | `7bb5ecb` |

> **No hay stakeholders identificados en el repositorio.** No hay nombres, ni áreas, ni
> aprobaciones. Lo que sí es observable es quién opera el sistema técnicamente: la misma persona
> que lo desarrolla. Esta tabla documenta esa realidad en lugar de suponer una organización.

## Inventario real

| Rol/área | Responsabilidad | Participación | Aprobaciones |
|---|---|---|---|
| **Dev owner** (único actor conocido) | Desarrollo, despliegue local, configuración de `.env`, carga de datos en `users` mediante el seeder, mantenimiento | Alta: única persona | Aprueba el código (auto-revisión). No hay aprobación externa |
| **Equipo propietario de Supabase** | Proyecto con `dev."Insumos"`; concede la credencial de solo lectura y decide los permisos | Desconocida | Desconocida |
| **Proveedor de SMTP** (Mailtrap en DEV) | Entrega del correo con el magic link | Externa | — |
| **Dentalia** (marca) | Dueño del diseño público que se replica | Ninguna relación contractual verificable | — |
| **Usuario del panel** | Consulta el catálogo | Uso final | — |
| **Responsable de negocio** | — | **No identificado** | — |
| **QA / UAT** | — | **No existe** | — |
| **Seguridad / cumplimiento** | — | **No identificado** | — |

## Funciones que el proyecto necesita y no tiene asignadas

| Función | Por qué hace falta | Riesgo de que siga sin dueño |
|---|---|---|
| **Aprobar el alcance del producto** | Nadie ha validado qué espera el usuario del sistema | Alto: se construye sobre una inferencia del código |
| **Decidir quién puede entrar** | El magic link exige un `User` previo y no hay proceso de alta | **Crítico**: si nadie carga usuarios, nadie entra |
| **Autorizar el acceso a `dev."Insumos"`** | La credencial es de solo lectura, pero su emisión depende del propietario de Supabase | Alto |
| **Clasificar los datos** | No está acordado si el catálogo es público | Medio |
| **Aprobar un despliegue** | No hay ambiente ni procedimiento | Alto: hoy nadie podría autorizar pasar a PROD |
| **Atender un incidente** | No hay runbook ni responsables | Alto: no hay a quién escalar |
| **Responder por el hardware** | Correo y catálogo son dependencias externas | Medio |
| **Hacer UAT** | Las features están en `DONE` sin validación | Medio |
| **Mantener el proyecto** | Un solo actor | Alto: punto único de fallo |

## Decisiones de stakeholders ya tomadas

| Decisión | Quién | Evidencia |
|---|---|---|
| El catálogo es de solo lectura | No identificado | ADR-004 |
| Se accede sin contraseña | No identificado | ADR-002 |
| Dos conexiones separadas (SQLite + Supabase) | No identificado | ADR-003 |
| CSS propio, sin Tailwind | No identificado | ADR-005 |
| Inertia sin SSR | No identificado | ADR-006 |
| Postgres con Lucid, no el cliente nativo de Supabase | No identificado | ADR-001 |

Los seis ADR están firmados por "Dev owner" porque es el único actor documentado. **Eso no significa
que el negocio los haya ratificado.**

## Referencias
- [Product brief](product-brief.md)
- [Alcance](scope.md)
- [Índice documental](../README.md)
- [features/README.md](../features/README.md)
- [ADR-000 · plantilla](../03-architecture/adr/ADR-000-template.md)

## Brechas

- **No hay nombres ni áreas**: no se puede contactar a nadie ni escalar a nadie.
- **Un solo actor para desarrollo, configuración y despliegue**: no hay separación de responsabilidades.
  Quien despliega es quien aprueba su propio código.
- **Nadie de negocio ha validado el alcance, el producto ni el estado `DONE` de las features**: el
  ciclo de vida documental se ha recorrido entero sin la entrada del cliente.
- **Nadie decide quién puede entrar al sistema**: es la brecha más urgente. Sin un proceso de alta de
  `users` aprobado, el producto no es utilizable por nadie que no sea quien cargo la base de datos a
  mano.
- **No hay responsable de seguridad**: los 34 requisitos SEC y los hallazgos priorizados no tienen a
  quién asignarles.
- **Los ADR no tienen decisores de negocio**: la columna "Decisores" dice "Dev owner" en los seis.
