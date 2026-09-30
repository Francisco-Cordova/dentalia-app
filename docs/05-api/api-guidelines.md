# Guías de API

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

Estas son las convenciones **que el código ya sigue**. No son recomendaciones genéricas: cada punto
indica dónde se aplica y qué lo incumple.

## Convenciones vigentes

### 1 · Validación de entrada con VineJS
Todo cuerpo o query con entrada pasa por `request.validateUsing(...)`:
`magicLinkValidator`, `signupValidator`, `loginValidator` (`app/validators/user.ts`).
**Excepción conocida**: `InsumosController.index` no valida `page`; usa `Number(request.input(...))`.

### 2 · Navegación por nombre de ruta, nunca por URL
```tsx
<Link route="insumos" />
router.get({ route: 'insumos', qs })
```
Los nombres viven en `.adonisjs/client/registry`. Regla operativa: **si el frontend referencia un
`route="..."`, la ruta en `start/routes.ts` debe llevar `.as()` con ese nombre**. Incumplirlo rompe
el build en el siguiente codegen (ya ocurrió: 4 rutas).

### 3 · El nombre de la página debe existir como archivo
`inertia.render('insumos', …)` resuelve `./pages/insumos.tsx`. El nombre también puede incluir
subdirectorio (`auth/login`, `errors/not_found`).

### 4 · Props planas y estables
Los controllers devuelven campos sueltos, no el objeto crudo de `paginate()`:
`{ insumos, total, page, lastPage, nombre, codigo }`. Motivo: desacoplar la UI del formato de
Lucid.

### 5 · El estado de la vista vive en la URL
Filtros y página viajan como query string (`qs`), de modo que cualquier vista es enlazable y el
botón atrás funciona sin estado global.

### 6 · Flash para mensajes, `errors` para validación
- Mensaje de resultado → `session.flash('success'|'error', ...)`; llega en el prop `flash` y se
  muestra con `sonner` (`inertia/layouts/default.tsx:14-21`).
- Error de validación → `errors.<campo>`, renderizado dentro del `Form`.

### 7 · `UserTransformer` antes de compartir datos
El prop `user` pasa por `app/transformers/user_transformer.ts`, que hace `pick` explícito. Nunca
serializar un modelo Lucid entero.

### 8 · Sin secretos ni datos de negocio en el cliente
`dev."Insumos"` expone solo 6 columnas; el resto no se selecciona aunque exista en la tabla.

### 9 · Sin filtrar detalles internos
En producción el handler no expone el detalle (`renderStatusPages = app.inProduction`,
`debug = !app.inProduction`). Ver [error-catalog.md](error-catalog.md).

## Códigos de estado en uso

| Código | Uso |
|---|---|
| 200 | Páginas y respuestas Inertia JSON |
| 302 | Redirección post-acción y control de acceso |
| 403/422 | **No se usan**: CSRF y validación fallida responden 302 y 422 respectivamente |
| 404 | Ruta inexistente y método no permitido en las páginas `router.on` |
| 500 | Excepción no controlada (p. ej. SMTP en producción) |

## Referencias
- [Vista general de la API](api-overview.md)
- [Contratos HTTP](http-contracts.md)
- `app/validators/`, `app/transformers/`, `start/routes.ts`

## Brechas

- **No hay correlation ID expuesto**: el servidor genera `request_id` en los logs, pero no se
  devuelve en la respuesta ni se propaga a las salidas (Supabase, SMTP).
- **`page` sin validar** y **`perPage` duplicado** entre servidor y cliente: dos convenciones que se
  pueden romper sin que ningún gate lo note.
- **No hay idempotencia**: ninguna operación de escritura es idempotente por diseño. `POST
  /signup` con el mismo correo falla por `unique`, y `POST /login/magic` siempre crea una fila.
- **No hay contrato OpenAPI**: las convenciones 1–9 solo se pueden verificar leyendo el código.
- **Los métodos POST no devuelven JSON**: los clientes que esperan un cuerpo (por ejemplo un test
  con `assertOk`) reciben un 302 y deben seguir la redirección.
