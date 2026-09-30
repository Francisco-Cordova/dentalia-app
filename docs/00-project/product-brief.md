# Product Brief

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | `7bb5ecb` |

> **Advertencia de método:** no existe un brief de negocio redactado por el negocio. Este documento
> es una **reconstrucción a partir del código**, no una declaración de producto. Todo lo que aquí
> afirma es observable en el repositorio; lo que no puede deducirse del código está marcado como
> brecha y **no se ha inventado**.

## Qué es

Un panel web para consultar el catálogo de insumos de una clínica dental, con acceso sin contraseña
por enlace mágico de un solo uso. Es un clon funcional y visual del catálogo de Dentalia.

## Objetivo

Permitir que el personal autorizado consulte el catálogo de insumos (nombre, código, marca,
cantidad y costo) desde una interfaz web, sin instalar nada y sin gestionar contraseñas.

## Problema

| Observación | Evidencia |
|---|---|
| El personal de la clínica necesita consultar insumos para presupuestar y pedir | La pantalla `/insumos` existe con tabla, buscador y paginación |
| El catálogo ya vive en Supabase, en un proyecto compartido con otras aplicaciones | La app se limita a leer `dev."Insumos"` (ADR-004) |
| Supabase corta las conexiones inactivas, lo que provoca errores esporádicos al navegar | `withConnectionRetry()` existe por eso (ADR-001, commit `5b4f99b`) |
| El catálogo de Dentalia está publicado como HTML estático | `Plantillas/<seccion>/Dentalia catalogo digital.html` es la referencia de diseño |
| No hay sistema previo, ni usuarios, ni credenciales | El proyecto tiene 4 commits: no hay historia de migración |

Lo que **no** puede deducirse del código: el volumen de usuarios reales, el impacto económico del
problema y si existe una alternativa vigente (Excel, consulta directa a Supabase, otro panel).

## Usuarios

| Tipo | Descripción | Acceso | Evidencia |
|---|---|---|---|
| **Usuario del panel** | Cualquier persona con una sesión válida. El código no distingue entre ellas | Todas las pantallas | `middleware.auth()` es binario; no hay columna de rol |
| Visitante | Sin sesión | Solo `/` y, escribiendo la URL, `/signup` | `middleware.guest()` protege `/` y `signup` |
| Destinatario del enlace | Persona a la que se envía el magic link y que hace clic una vez | Obtiene sesión al consumir el enlace | `magic_link_controller.ts` |

**No hay roles de negocio definidos.** El sidebar muestra una sección "Admin" (usuarios, zonas,
módulos de salud) pero no corresponde a ningún permiso: es un regrouping visual.

## Módulos y estado real

| Código | Módulo | Estado | Origen de datos |
|---|---|---|---|
| `AUT` | Autenticación por magic link | **Funcional** | SQLite |
| `INS` | Catálogo de insumos | **Funcional** | Supabase `dev."Insumos"` |
| `SKU` | SKUs | Maqueta (array en el `.tsx`) | Ninguno |
| `FAM` | Familias | Maqueta | Ninguno |
| `KIT` | Kits de insumos | FEATURE-005 `READY` | `dev."Kits"` (40 filas) |
| `ZON` | Zonas | Maqueta | Ninguno |
| `MSD` | Módulos de salud | Maqueta | Ninguno |
| `USR` | Usuarios | Maqueta | Ninguno |
| `ADM` | Shell del panel (sidebar, layout, toasts) | Funcional | — |

De las 9 secciones del sidebar, **1 de 8 páginas de dominio tiene datos** (`/insumos`); las otras 7
importan arrays hardcodeados dentro del propio archivo de la página.

## Volumen esperado

| Métrica | Valor | Estado |
|---|---|---|
| Filas en `dev."Insumos"` | ~5.060 | **No reverificado.** Viene de `AGENTS.md`. Confirmar con `SELECT count(*) FROM dev."Insumos"` |
| Paginación | 10 filas por página | Implementado |
| Usuarios registrados en `users` | **Desconocido** | Sin dato; la tabla es local de la máquina de desarrollo |
| Filas en `magic_links` | **Desconocido** | Crece sin purga (SEC-009) |
| Concurrencia esperada | **Sin definir** | Nadie lo ha declarado |
| Usuarios / mes | **Sin definir** | Nadie lo ha declarado |

No hay métricas de volumen verificadas, así que no se inventan. El único número de volumen
defendible es el de la tabla, y está pendiente de confirmar.

## Integraciones

| Sistema | Propósito | Dirección | Estado |
|---|---|---|---|
| Supabase (PostgreSQL) | Catálogo de insumos | Solo lectura | Activa, con SSL, keepalive y reintento |
| SMTP (Mailtrap en DEV) | Envío del magic link | Saliente | Activa en DEV; sin build de producción que la exercise |
| SQLite (`tmp/db.sqlite3`) | `users`, `magic_links` | Local | Activa, gitignored, sin respaldo |
| Inertia | Frontera entre servidor y React | Interna | Activa |

## Restricciones

| Tipo | Restricción | Evidencia |
|---|---|---|
| Técnica | Sin CI, sin tests, sin suite de navegador | `tests/` solo tiene `bootstrap.ts` |
| Técnica | Un solo ambiente (DEV local) | No hay despliegue ni infraestructura |
| Técnica | Catálogo de solo lectura: no se puede escribir en Supabase | `migrations.paths: []` en la conexión `supabase` |
| Técnica | El diseño replica el HTML publicado por Dentalia | `Plantillas/` |
| Negocio | **Desconocida** | No hay documento de negocio en el repositorio |
| Legal | **Desconocida.** No hay clasificación de datos acordada ni política de retención | Ver [clasificación de datos](../06-security/data-classification.md) |
| Legal | El catálogo se trata como público, pero no está acordado por escrito | El equipo propietario de Supabase puede tener otros permisos |

## Ambientes

**Solo DEV.** No existen TEST, UAT ni PROD.

| Ambiente | Existe | Notas |
|---|---|---|
| DEV (local, `localhost:3333`) | Sí | Único. `NODE_ENV=development`, datos de auth en `tmp/db.sqlite3`, CORS refleja cualquier origen |
| TEST | No | — |
| UAT | No | — |
| PROD | No | Sin build de producción, sin despliegue, sin variables separadas |

La ausencia de PROD es la brecha estructural más importante del proyecto: `SESSION_DRIVER=cookie`,
`Secure`, HSTS y `renderStatusPages` solo se activarían con `NODE_ENV=production`, un modo que
nunca se ha ejecutado.

## Criterios de éxito

Los que el código permite afirmar, y los que nadie ha definido:

| Criterio | Métrica | Estado |
|---|---|---|
| Alguien sin contraseña entra al panel | Enlace consumido una vez → 302 a `/skus` | **Verificado por HTTP** |
| El catálogo se puede consultar | `/insumos` devuelve 10 filas paginadas con 200 | **Verificado por HTTP** |
| Los buscadores filtran | Por `nombre` y por `codigo` (`DEFAULT_CODE`), con `escapeLike()` | **Verificado por HTTP** |
| Navegar el catálogo no falla por cortes de conexión | `withConnectionRetry()` | **Verificado por HTTP** |
| Nadie entra sin sesión | 302 a `/` en las 9 rutas del panel | **Verificado por HTTP** |
| Usuarios activos / adopción | — | **Sin definir** |
| Disponibilidad objetivo | — | **Sin definir** |
| Tiempo de carga máximo aceptable | — | **Sin definir** |
| Satisfacción del usuario | — | **Sin medir** |

## Referencias
- [Alcance](scope.md)
- [Glosario](glossary.md)
- [Stakeholders](stakeholders.md)
- [Contexto del sistema](../03-architecture/system-context.md)
- [Módulos](../02-functional-design/modules.md)
- [Funcionalidades](../01-requirements/functional-requirements.md)

## Brechas

- **No hay brief de negocio**: el objetivo, el problema y el usuario de este documento son una
  lectura del código. Sin validación de quien pidió el sistema, la definición de "correcto" no
  existe.
- **No hay criterios de éxito de negocio**: los seis verificables son técnicos; nadie ha declarado
  una métrica de producto.
- **No hay datos de volumen verificados**: ni usuarios, ni uso, ni frecuencia de consulta.
- **No hay stakeholders identificados**: ver [stakeholders.md](stakeholders.md).
- **El 7 de 8 páginas de dominio son maquetas**: el producto visible es, hoy, un buscador de
  insumos; el resto del panel no tiene detrás nada.
- **No existe PROD**: no hay forma de saber si el sistema está listo para operar, porque nunca se
  ha operado fuera de una máquina de desarrollo.
