# Estándares de código

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Convenciones de nombres

Las que impone el linter o el framework; el resto es convención del proyecto.

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos | `snake_case` (regla `@unicorn/filename-case`) | `insumos_controller.ts`, `modulos_de_salud.tsx` |
| Clases | `PascalCase` | `InsumosController`, `MagicLink` |
| Componentes React | `PascalCase` en `inertia/components/` | `icon.tsx` → `Icon` (el archivo va en snake_case) |
| Funciones y variables | `camelCase` | `withConnectionRetry()`, `escapeLike()` |
| Constantes | `SCREAMING_SNAKE_CASE` | `MAIL_FROM` |
| Tablas de auth | `snake_case` plural | `users`, `magic_links` |
| Tabla del catálogo | El nombre real, con mayúscula | `"Insumos"` (columnas en `UPPER_CASE`: `NAME`, `DEFAULT_CODE`, `MARCA`) |
| Tipos de props | `InertiaProps<T>` | `InertiaProps<{ insumos: Insumo[] }>` |
| Nombres de ruta | `snake_case`, deben conservarse al cambiar la URL | `insumos`, `session.destroy`, `magic_link.send` |

Punto crítico: la URL puede cambiar, el **nombre** no, si el cliente lo referencia
(`<Link route="insumos">`). Un `.as()` perdido rompe la navegación en silencio hasta que falla el
typecheck.

## Manejo de errores

| Situación | Patrón |
|---|---|
| Validación de entrada | Esquema VineJS en `app/validators/`; los mensajes llegan a la vista en `errors` |
| Regla de negocio | Throw de `DomainException` en `app/exceptions/`, registrado en el handler |
| Excepción no prevista | `renderStatusPages` devuelve la página de error en `inertia/pages/errors/`; en DEV el detalle se muestra porque `debug: true` |
| Fallo de conexión a Supabase | `withConnectionRetry()` reintenta una vez antes de propagar |
| Error hacia el usuario | `session.flash('error', ...)`; nunca `console.log` |

Sobre el primer punto: en la práctica **ninguna ruta usa VineJS todavía**. `/signup` valida a mano y
el login solo comprueba que el campo no esté vacío. Los esquemas existen como estructura pero están
sin conectar, así que la validación real de entradas no está cubierta por tipo.

## Logging

| Regla | Detalle |
|---|---|
| Usar `logger` de AdonisJS | `logger.info/error/warning`. Nunca `console.log` (pasa el lint, pero no llega al log estructurado) |
| Contexto | Usar el segundo argumento: `logger.info({ email }, 'Magic link enviado')` |
| Nivel correcto | `error` solo si alguien debe actuar; `warning` para degradación; `info` para el ciclo de vida |
| **Nunca** registrar secretos | Ni contraseñas, ni `token_hash`, ni `SUPABASE_DB_URL` |
| Excepción en DEV | `MagicLinkController` loguea la URL completa del magic link cuando Mailtrap falla, para poder probarlo sin correo. **No lleva esa marca en producción**: hoy no hay build de PROD, así que el riesgo es teórico, pero es la razón por la que el token puede aparecer en logs |

## Dependencias

Criterio para añadir una librería nueva:

| Pregunta | Si la respuesta es "no" |
|---|---|
| ¿Lo resuelve la plataforma? (AdonisJS, Lucid, VineJS, Inertia) | No añadir: una dependencia es una superficie de ataque y una actualización pendiente |
| ¿La usan ya otras dependencias? | Preferir la transitiva a declararla |
| ¿Está en mantenimiento? | No añadir |
| ¿Qué pasa si desaparece? | Debe haber un plan de reemplazo razonable |
| ¿Aumenta el bundle del cliente? | Afecta a cada visitante; pesar con especial cuidado |

Restricciones actuales del proyecto:

- **Iconos**: solo `inertia/components/icon.tsx` (Phosphor). No añadir otra librería de iconos.
- **Estilos**: CSS propio en `inertia/css/app.css`. **No** añadir Tailwind ni CSS modules (ver
  [ADR-005](../03-architecture/adr/ADR-005-css-propio-sin-tailwind.md)).
- **Cliente**: React 19 + los hooks de Inertia. No añadir otro gestor de estado sin justificarlo.
- **Notificaciones**: `session.flash` y el layout. No añadir una librería de toasts.
- **Navegación**: `Link`/`Form` de `@adonisjs/inertia/react`. No usar `@inertiajs/react` para esos
  componentes.

## Comentarios

Documentar el porqué, no repetir lo que el código ya expresa.

```ts
// Mal: repite el código
// suma los amounts
const total = amounts.reduce((a, b) => a + b, 0)

// Bien: explica por qué
// El esquema `dev` va primero en searchPath porque las tablas del catálogo
// solo existen ahí; `public` es el fallback para las de auth.
knex.raw(`set search_path to ${schema},public`)
```

## Referencias
- [Guías de desarrollo](development-guidelines.md)
- [Entorno de desarrollo](development-environment.md)
- [Errores HTTP](../05-api/error-catalog.md)
- `eslint.config.js`, `adonisrc.ts`

## Brechas

- **Ninguna regla de lint prohíbe `console.log`**: es la convención más fácil de violar.
- **Formato inconsistente**: existe `npm run format` pero no se ejecuta de forma sistemática, así
  que conviven estilos dentro del mismo archivo.
- **VineJS declarado pero no usado**: la tabla de validación de errores describe el patrón
  deseado, no el implementado.
- **Sin política de dependencias**: no hay `npm audit` en el flujo, ni versiones fijadas de
  forma exacta, ni revisión de licencias.
- **El log del magic link en DEV no está condicionado a `inProduction`**: depende de que el flag
  `inProduction` se ponga a `true` en el build de producción.
