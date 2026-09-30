# ADR

Crear un ADR cuando una decisión arquitectónica relevante tenga alternativas, trade-offs o impacto duradero.

## Convenciones
- ID correlativo `ADR-<NNN>`, título `ADR-NNN · <Decisión>`.
- Estados: `Proposed` → `Accepted` → (`Deprecated` / `Superseded`).
- Solo se versiona un ADR **decidido**: los borradores se discuten antes de llegar aquí.

| ID | Decisión | Estado |
|---|---|---|
| [ADR-001](ADR-001-driver-postgres-lucid.md) | Conectar a Supabase con `pg` + Lucid en vez de supabase-js / PostgREST | Accepted |
| [ADR-002](ADR-002-autenticacion-magic-link.md) | Autenticación por enlace mágico, sin contraseña | Accepted |
| [ADR-003](ADR-003-dos-conexiones-search-path.md) | Dos conexiones (SQLite para auth, Supabase para catálogo) con `searchPath: ['dev','public']` | Accepted |
| [ADR-004](ADR-004-catalogo-solo-lectura.md) | Catálogo de Supabase de solo lectura, sin migraciones | Accepted |
| [ADR-005](ADR-005-css-propio-sin-tailwind.md) | CSS propio en `app.css`, replicando el HTML de `Plantillas/` | Accepted |
| [ADR-006](ADR-006-inertia-sin-ssr.md) | SPA de Inertia sin SSR | Accepted |

## Plantilla
Copiar [ADR-000-template.md](ADR-000-template.md) para una decisión nueva.
