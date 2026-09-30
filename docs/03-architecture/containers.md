# Contenedores / aplicaciones

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

El sistema es un **monolito con dos procesos en desarrollo** (API y assets) que comparten origen.
No hay worker, cola ni microservicio.

| Componente | Responsabilidad | Tecnología | Despliegue | Datos |
|---|---|---|---|---|
| **Server** | HTTP, sesión, auth, páginas Inertia, orquestación de consultas | AdonisJS 7 (`node ace serve` / `node ace serve --hmr`), Node ≥ 24 | Un proceso en un host, puerto `PORT` (3333 en DEV) | Escribe en `tmp/db.sqlite3` (auth). Lee `dev."Insumos"` en Supabase |
| **Cliente (bundle SPA)** | Render de páginas, tablas, buscadores, paginación, toasts | React 19 + `@inertiajs/react` 3.7 (wrapper `@adonisjs/inertia` 5), compilado por Vite 8, toasts con `sonner` 2 | Se sirve como assets del mismo origen (`public/assets` en build; dev server de Vite en desarrollo) | Sin persistencia local: no usa `localStorage` ni estado global |
| **Plantillas (referencia)** | Fuente de verdad de diseño (HTML + assets volados) | HTML/CSS/JS estático de Bubble | No se despliega: vive en el repositorio como referencia | — |
| **API JSON** | **No existe** | — | — | `providers/api_provider.ts` y el cliente Tuyau están montados, pero ninguna ruta devuelve JSON |

## Estructura de directorios con responsabilidad

| Ruta | Contenido |
|---|---|
| `app/controllers` | Manejadores HTTP por ruta (`Insumos`, `MagicLink`, `Session`, `NewAccount`) |
| `app/middleware` | Auth, guest, silent-auth, Inertia share, bindings |
| `app/models` | Modelos Lucid: `User`, `MagicLink` (SQLite), `Insumo` (Supabase) |
| `app/services` | `with_connection_retry` (tolerancia a cortes de conexión del catálogo) |
| `app/transformers` | `UserTransformer` (evita serializar el password) |
| `app/validators` | Esquemas VineJS para entradas |
| `app/mails` + `resources/views/emails` | Correo del magic link (Edge) |
| `inertia/pages` | Una página por pantalla (`.tsx`). Admin, auth y errores |
| `inertia/layouts` | `admin` (sidebar/usuario), `default` (selector de layout + toasts) |
| `inertia/components` | `icon` (set cerrado de iconos SVG), `brand_logo` (sin uso) |
| `inertia/css/app.css` | **Todo** el CSS (1,082 líneas, CSS plano, sin Tailwind) |
| `config` | `database` (SQLite + Supabase), `session`, `shield`, `encryption`, `auth`, `mail`, `inertia`, `vite`, `logger`, `app` |
| `start` | `routes` (14 rutas, las 14 con nombre), `kernel` (stacks de middleware), `env` (validación de env) |
| `database` | `migrations` (SQLite), `seeders`, `schema.ts` (esquema Lucid generado, no editar) |
| `.adonisjs` | Tipos y rutas **generados** por codegen; versionados |
| `Plantillas` | HTML de origen por sección (referencia de diseño) |

## Verificación

- `npm run lint` y `npm run typecheck` (server + cliente Inertia) en verde.
- El bundle se construye con `node ace build` (hook de Vite en `adonisrc.ts:buildStarting`).

## Brechas

- **No hay cliente HTTP real**: la SPA solo habla con su propio origen vía Inertia.
- **`inertia/ssr.tsx` es código muerto**: SSR está desactivado (`config/inertia.ts:ssr.enabled=false`), y el archivo ni siquiera importa el CSS ni las fuentes (`inertia/app.tsx` sí lo hace), de modo que quedaría sin estilos si se activara.
- **`inertia/components/brand_logo.tsx` no se usa**; el logo efectivo es `public/logo-dentalia.svg`.
- **Código muerto en el servidor**: `SessionController.store` (login por contraseña) no tiene ruta que lo monte y no hay enlace en la UI; `stores.database()` de sesión no es funcional sin la tabla `sessions`.
- **El layout decide por URL, no por estado**: `inertia/layouts/default.tsx:9` trata como pantalla de auth solo `'/'` y `'/signup'`. Cualquier otra ruta (incluidas las páginas de error y `/auth/magic/:token`) monta el `AdminLayout`.
- No hay contenedor para tareas programadas (limpieza de `magic_links`, por ejemplo).

## Referencias
- Arquitectura global: [architecture.md](architecture.md)
- Decisiones: [adr/](adr/)
