# Arquitectura del sistema

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Contexto

Dentalia es un panel web para consultar el catálogo de insumos de una clínica. Replica el diseño
de un catálogo Bubble original, volcado en `Plantillas/<seccion>/` como HTML + assets. El usuario
se autentica sin contraseña (enlace de un solo uso por correo) y navega ocho secciones; a la fecha
solo **Insumos** está conectada a datos reales, el resto son maquetas.

## Estilo arquitectónico

**Monolito modular.** Un solo proceso AdonisJS que sirve la API HTML de Inertia y los assets. Tres
módulos lógicos con fronteras observables en el código (autenticación, catálogo, shell del panel).
No hay microservicios, ni cola, ni eventos de dominio.

**Justificación:** el dominio es de consulta sobre un catálogo existente; una sola base de código
y un solo despliegue reducen el costo operativo sin sacrificed capacidad (ver
[ADR-001](adr/ADR-001-driver-postgres-lucid.md) para la decisión del acceso a datos).

## Aplicaciones

- **Server** (`app/`, `start/`, `config/`): HTTP, sesión, auth, páginas Inertia, acceso a datos. Sin API JSON.
- **Cliente SPA** (`inertia/`): React 19, same-origin, sin estado global. Vite 8 para dev y build.
- **Worker**: no existe.
- **API JSON**: no existe.

## Flujo de petición

```
navegador
  → server stack: bindings → estáticos → CORS → Vite → Inertia (comparte user/errors)
  → router stack: bodyparser → sesión → Shield (CSRF) → init auth → silent auth
  → named: guest (público) | auth (panel)
  → controller → modelo Lucid → conexión (SQLite | Supabase)
  → inertia.render('x') → respuesta HTML con props
  (el cliente navega después vía XHR a la misma ruta, con cabecera X-Inertia)
```

Para peticiones Inertia (navegación interna), el servidor responde **JSON** con `props`,
`url`, `version` y un nuevo `X-Inertia` de revalidación; la primera carga devuelve HTML.

## Comunicación

- **Síncrona**: HTTP same-origin. El servidor espera la consulta a BD o al SMTP antes de responder.
- **Asíncrona**: ninguna. No hay colas, eventos ni jobs en background.

## Archivos / caché / jobs / eventos

- **Sin caché**: cada visita a `/insumos` ejecuta 2 consultas (conteo + página) contra Supabase.
- **Sin jobs**: en particular, `magic_links` no se depura (tokens usados y expirados se acumulan).
- **Sin eventos**: los eventos de sesión que emite `@adonisjs/auth` (`session_auth:login_succeeded`)
  no tienen listener.
- Archivos estáticos: build a `public/assets`, gitignored; en DEV los sirve el dev server de Vite.

## Manejo de errores

- `app/exceptions/handler.ts` renderiza páginas de error propias (`errors/not_found`,
  `errors/server_error`) **solo en producción** (`renderStatusPages = app.inProduction`).
- En DEV se expone el detalle del error (p. ej. el mensaje del driver de BD).
- Sin correlación propia: cada petición tiene `request_id` (log), que no se propaga a respuestas ni a
  servicios externos.
- Sin traducción de errores de negocio a códigos: los mensajes van directo al flash/toast.

## Restricciones arquitectónicas

- El catálogo de Supabase es **externo y de solo lectura**: `migrations.paths: []` para esa conexión.
- El `searchPath` pone `dev` antes que `public` porque existe una tabla homónima; los modelos no
  declaran schema.
- Los assets son un bundle único servido desde el mismo origen (sin CDN).
- Todo el CSS vive en un archivo plano; no hay Tailwind ni CSS modules (ver
  [ADR-005](adr/ADR-005-css-propio-sin-tailwind.md)).
- El cliente se resuelve con `resolvePageComponent` sobre `import.meta.glob` (lazy por defecto); el
  nombre de la página debe coincidir con el archivo (ver `AGENTS.md`).

## Referencias
- Contexto: [system-context.md](system-context.md)
- Componentes: [containers.md](containers.md)
- Integraciones: [integrations.md](integrations.md)
- Diagramas de datos: [er-diagram.md](../04-database/er-diagram.md)
- Decisiones: [adr/](adr/)

## Brechas

- **Sin API**: la frontera es HTML/JSON de Inertia; no hay contrato OpenAPI (ver [api-overview](../05-api/api-overview.md)).
- **Sin tests**: cero `*.spec.ts`; la calidad se apoya en lint + typecheck y scripts de humo.
- **Sin CI/CD**: no hay pipeline ni ambientes separados (ver [environments](../09-infrastructure/environments.md)).
- **Sin caché ni materialización**: el catálogo se consulta en vivo en cada navegación.
- La lógica de negocio vive en los controllers (no hay capa de casos de uso ni de dominio), lo que
  limita la reutilización y las pruebas unitarias.
