# Entorno de desarrollo

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Requisitos

| Elemento | Versión | Cómo se fija |
|---|---|---|
| Node.js | **≥ 24** | `package.json` → `engines.node`. No hay `.nvmrc` |
| TypeScript | `~6.0.3` | `devDependencies` |
| Gestor | npm | No hay lockfile alternative ni `pnpm`/`yarn` |
| Extensiones nativas | `better-sqlite3`, `edge.js`, `pg` | Se compilan o descargan al instalar |

## Puesta en marcha

```bash
npm install
cp .env.example .env      # y completar los secretos
node ace migration:run    # crea users y magic_links en SQLite
node ace db:seed          # crea el usuario de pruebas para el magic link
npm run dev               # servidor + Vite en :3333
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | `node ace serve --hmr`. Puerto `PORT` (3333 en DEV) |
| `npm run build` | `node ace build` (Vite: assets a `public/assets`) |
| `npm start` | `node bin/server.js` (requiere `npm run build` antes) |
| `npm run lint` | ESLint flat config |
| `npm run lint -- --fix` | Corrige lo corregible |
| `npm run format` | Prettier |
| `npm run typecheck` | `tsc --noEmit` (server) + `tsc -p inertia/tsconfig.json` |
| `npm test` | `node ace test` — **no ejecuta nada**: solo existe `tests/bootstrap.ts` |
| `node ace codegen` | **Obligatorio** tras crear controllers o cambiar rutas/modelos |

> No existe script `codegen` en `package.json`. Usar `node ace codegen`.

## Configuración: `.env` frente a `.env.example`

`.env` está en `.gitignore`; `.env.example` es el placeholder. `start/env.ts` valida las variables
al arrancar y falla temprano si falta alguna.

| Variable | Tipo | Nota |
|---|---|---|
| `PORT` | numérica | 3333 |
| `NODE_ENV` | `development` | Controla `inProduction`, que decide `Secure` de cookies, `debug` y `renderStatusPages` |
| `APP_URL` | URL | Se usa para construir el enlace del magic link |
| `APP_KEY` | texto | Cifrado AES-256-GCM de sesiones. Generar con `node ace generate:key` |
| `SESSION_DRIVER` | `cookie` o `database` | Solo `cookie` funciona (no hay tabla `sessions`) |
| `SUPABASE_DB_URL` | URL | **Debe incluir `:PASSWORD`** |
| `SMTP_*` | varias | `SMTP_HOST`, `SMTP_PORT` (2525), `SMTP_USERNAME`, `SMTP_PASSWORD` |
| `MAIL_FROM` | email | Remitente |

## HMR y qué reinicia

| Cambio | ¿Se aplica sin reiniciar? |
|---|---|
| `app/controllers/**` | Sí |
| `app/middleware/*.ts` | Sí |
| `inertia/**` | Sí (Vite) |
| `config/**` | **No**: reiniciar |
| `app/models/**` | **No**: reiniciar |
| `.env`, `adonisrc.ts` | **No**: reiniciar |

`package.json` → `hotHook.boundaries` solo cubre `app/controllers/**` y `app/middleware/*.ts`.
Reiniciar es la opción segura cuando el comportamiento no cuadra.

## Verificación sin tests

Como no hay suite de tests, la verificación es:

```bash
npm run lint
npm run typecheck
```

y, para cambios de comportamiento, un smoke por HTTP: levantar `npm run dev` y consultar las rutas
afectadas con la cookie de sesión (ver [estrategia de pruebas](../08-quality/test-strategy.md)).

## Trampas conocidas

| Trampa | Detalle |
|---|---|
| `SUPABASE_DB_URL` sin contraseña | `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string` |
| `codegen` borra rutas sin `.as()` | Si el frontend usa `route="x"`, la ruta **debe** llevar `.as('x')` |
| `form { flex-direction: column }` global | Rompe cualquier `<form>` horizontal sin override |
| Enter no dispara submits implícitos | Un `<form>` con 2+ inputs y sin botón no se envía con Enter: interceptar `onKeyDown` |
| El nombre de la página debe existir | `renderInertia('modulos_de_salud')` → `pages/modulos_de_salud.tsx` |
| `Link`/`Form` de `@adonisjs/inertia/react` | Importarlos de `@inertiajs/react` es un error de lint |
| `tmp/*` está gitignored | Incluye `db.sqlite3`: **borrar `tmp/` borra la base de datos de auth** |

## Referencias
- [Guías de desarrollo](development-guidelines.md)
- [Flujo de trabajo Git](git-workflow.md)
- [Estrategia de pruebas](../08-quality/test-strategy.md)
- `package.json`, `adonisrc.ts`, `eslint.config.js`, `start/env.ts`

## Brechas
- [Ver brechas en development-guidelines.md](development-guidelines.md#brechas)
