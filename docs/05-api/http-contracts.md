# Contratos HTTP

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Modelo de respuesta

El protocolo de Inertia define dos formas de responder a la misma ruta:

| Petición | Cabecera `X-Inertia` | Respuesta |
|---|---|---|
| Carga inicial (o recarga) | ausente | **HTML**: shell de `resources/views/inertia_layout.edge` + `data-page` con los props |
| Navegación interna | `X-Inertia: true` | **JSON** con `component`, `props`, `url`, `version` |
| Reutilización de componente | `X-Inertia` + `X-Inertia-Partial-Data` | JSON parcial |
| Recarga de assets viejos | — | **409 Conflict** + `X-Inertia-Location` para forzar recarga |

## Props compartidas (todas las páginas)

Definidos en `app/middleware/inertia_middleware.ts`:

| Prop | Origen | Nota |
|---|---|---|
| `errors` | `ctx.inertia.always(getValidationErrors(ctx))` | Errores de validación VineJS |
| `user` | `auth?.user` → `UserTransformer` | `id`, `fullName`, `email`, `createdAt`, `updatedAt`, `initials`. **Nunca el password** |
| `flash.error` | `session.flashMessages.get('error')` | Llega como campo de nivel superior, no dentro de `props` |
| `flash.success` | `session.flashMessages.get('success')` | Ídem |

## `GET /insumos` — el contrato de catálogo de referencia

### Entrada (query string)

| Param | Tipo | Default | Regla |
|---|---|---|---|
| `page` | entero | `1` | `Number(request.input('page','1'))`. Sin validación de rango: un `page=0` o negativo lo controla `paginate()` |
| `nombre` | texto | `''` | Trim; si no vacío, `NAME ILIKE '%valor%'` |
| `codigo` | texto | `''` | Trim; si no vacío, `DEFAULT_CODE ILIKE '%valor%'` |

Los filtros se aplican **en conjunto** (AND). `escapeLike()` escapa `%` y `_`.

### Salida (`inertia.render('insumos', {...})`)

```json
{
  "insumos": [
    { "id": 1, "nombre": "...", "codigo": "...", "categoria": "...", "cantidad": 10, "costo": 1.5 }
  ],
  "total": 5060,
  "page": 1,
  "lastPage": 506,
  "nombre": null,
  "codigo": null,
  "user": { "...": "..." },
  "errors": {},
  "flash": { "error": null, "success": null }
}
```

- `perPage` es fijo en 10, en el servidor (`insumos_controller.ts:12`) **y** en el cliente
  (`insumos.tsx:23`): dos constantes que deben coincidir.
- `total`, `page` y `lastPage` son planos, deliberadamente, para que la página no dependa del
  formato de `paginate()`.
- Los filtros vuelven como `null` cuando están vacíos (no como `""`).

## `GET /usuarios` - listado de cuentas

### Entrada (query string)

| Param | Tipo | Comportamiento |
|---|---|---|
| `page` | número | Página de 10; fuera de rango devuelve la última página (no 404) |
| `q` | texto | Un solo buscador: `full_name OR email` |

### Salida (`inertia.render('usuarios', {...})`)

| Prop | Tipo | Nota |
|---|---|---|
| `usuarios` | `array` | `id`, `nombre`, `correo`, `area`, `rol`, `superadmin`; **sin `password`** |
| `total` | número | Total **filtrado** |
| `page` / `lastPage` | número | Planos, igual que el resto de catálogos |
| `q` | `string \| null` | Vuelve `null` si no hay término |

- `superadmin` es `boolean` y la página lo muestra como Sí/No; `area` y `rol` son `string` y pueden
  venir `null`, que la UI pinta como `—`.
- El `select` nombra las columnas una a una. Es deliberado: `password` es `NOT NULL` en `users`, así
  que un `SELECT *` filtraría el hash a la vista.
- El filtro se arma con `whereRaw("full_name LIKE ? ESCAPE '\\'")`, no con `where(..., 'like')`:
  SQLite necesita la cláusula `ESCAPE` explícita para que el backslash de `escapeLike()` funcione.
- No hay ruta de escritura: POST, PUT, DELETE y PATCH sobre `/usuarios` devuelven 404.

## Contratos de las páginas mock

Las páginas que siguen mock (`/skus`, `/familias`, `/home`) se sirven con
`renderInertia('<nombre>', {})`: sin props de negocio. La UI muestra estructura fija.
`inertia/pages/` contiene 12 páginas (8 del panel, 2 de auth, 2 de error).

## Códigos de estado observados (verificado por HTTP)

| Situación | Código | Ubicación |
|---|---|---|
| Panel con sesión | 200 | — |
| Ruta protegida sin sesión | 302 → `/` | `auth_middleware.ts:22` |
| Magic link válido | 302 → `/skus` | `magic_link_controller.ts:68` |
| Token inválido / expirado / reutilizado | 302 → `/` + flash error | `:59-62` |
| Magic link enviado (registrado o no) | 302 atrás + flash success | `:45-46` |
| `POST /signup` con correo duplicado | 422 (errores de validación) | `signupValidator` |
| Logout correcto | 302 → `/` | `session_controller.ts:20` |
| Logout sin XSRF | 302 atrás + flash error; **sesión intacta** | `@adonisjs/shield` |
| `POST /skus` (método no permitido) | 404 | `router.on` solo registra GET |
| 404 en DEV | 404 + página de depuración (~52 KB) | `handler.ts:17` `renderStatusPages = app.inProduction` |
| 404 en producción | 404 + `errors/not_found` | `handler.ts:24` |

## Cabeceras relevantes

| Cabecera | Valor observado | Origen |
|---|---|---|
| `X-Frame-Options` | `DENY` | Shield |
| `Strict-Transport-Security` | `max-age=15552000` | Shield (activo **incluso en DEV**) |
| `X-Content-Type-Options` | `nosniff` | Shield |
| `Content-Security-Policy` | **ausente** | `config/shield.ts:12` `enabled: false` |
| `Set-Cookie: XSRF-TOKEN` | cifrado | Shield (`enableXsrfCookie: true`) |
| `Set-Cookie: adonis-session` | `HttpOnly`, `SameSite=Lax`, `Secure` solo en producción | `config/session.ts:40-51` |
| `Access-Control-Allow-Origin` | refleja el origen **en DEV**; vacío en producción | `config/cors.ts:21` |

## Referencias
- [Vista general de la API](api-overview.md)
- [Flujo de Insumos](../02-functional-design/flows/FLOW-INS-001.md)
- [Flujo de Usuarios](../02-functional-design/flows/FLOW-USR-001.md)
- [Flujo de autenticación](../02-functional-design/flows/FLOW-AUT-001.md)
- `inertia/pages/insumos.tsx`, `app/controllers/insumos_controller.ts`

## Brechas

- **Sin contrato versionado**: no hay `version` de Inertia configurado, así que un HTML cacheado no
  fuerza recarga de assets.
- **`page` sin validar**: `Number('abc')` produce `NaN`; el comportamiento depende de cómo lo
  traduzca `paginate()` en vez de un `validator` explícito.
- **`perPage` duplicado** entre servidor y cliente: si uno cambia, la paginación se desalinea sin
  que ningún gate lo detecte.
- **Sin CSP**: nada restringe qué scripts y estilos puede cargar la página.
- **Errores de validación sin estructura común**: cada formulario lee `errors.<campo>`; no hay
  contrato de error compartido ni códigos de negocio.
- **Los errores 500 en DEV filtran detalle interno** (p. ej. el mensaje del driver de PostgreSQL)
  porque `handler.ts:10` usa `debug = !app.inProduction`.
- **El buscador de `/usuarios` depende de que SQLite compare sin distinguir mayúsculas**: `LIKE` de
  SQLite solo es case-insensitive para ASCII, así que un término con acentos o `ñ` no coincide como
  en PostgreSQL. Con la convención actual de correos y nombres en ASCII no se nota.
- **`ESCAPE '\'` es obligatorio en el filtro de `/usuarios`**: es la diferencia entre un buscador que
  escapa `%`/`_` y uno donde esos caracteres siguen siendo comodines. Se midió el 2026-10-01 con
  `better-sqlite3`: sin la cláusula, el patrón `%\%` busca la cadena `a\Xb` y no encuentra ni un
  `%` literal ni `a%b`.
