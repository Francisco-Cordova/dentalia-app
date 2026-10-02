# Glosario

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | `7bb5ecb` |

Términos usados en la documentación, con la definición **real del proyecto**. Cuando el término
tiene un sentido de mercado distinto del de aquí, se indica.

## Producto y dominio

| Término | Definición | Contexto |
|---|---|---|
| **Catálogo** | Listado de productos que la clínica puede comprar. En el sistema, la tabla `dev."Insumos"` | `INS` |
| **Insumo** | Fila del catálogo: un producto con nombre, código, marca, cantidad y costo | `INS` |
| **Código** | Identificador de negocio del insumo. En la BD es la columna `DEFAULT_CODE`, **no** `ID` | `INS` |
| **SKU** | Unidad de inventario con variantes. Catálogo real en `dev."SKU"` (255 filas, 25 columnas); la definición exacta sigue siendo provisional. La pantalla muestra 7 columnas, de las cuales solo `Nombre` (con sus dos IDs) tiene dato real | `SKU` |
| **Familia** | Agrupación de productos. Hoy es una pantalla sin datos | `FAM` |
| **Kit** | Conjunto de insumos que se venden juntos. Catálogo real en `dev."Kits"` (40 filas) | `KIT` |
| **Zona** | Agrupación geográfica o de sucursal. Catálogo real en `dev."zonas"` (2 filas: Turista, Nacional); la definición exacta sigue siendo provisional | `ZON` |
| **Módulo de salud** | Agrupación de productos por especialidad clínica. Catálogo real en `dev.modulos_salud` (10 filas: PERIODONCIA, ORTODONCIA, ENDODONCIAS…); su definición exacta sigue siendo provisional | `MSD` |
| **Dentalia** | Nombre de la marca cuyo catálogo público se replica como referencia de diseño | `ADM`, `Plantillas/` |
| **Panel** | Área autenticada de la aplicación, con sidebar y 9 secciones | `ADM` |

## Autenticación

| Término | Definición | Contexto |
|---|---|---|
| **Magic link** | Acceso sin contraseña: se recibe por correo un enlace con un token de un solo uso | `AUT` |
| **Token** | 32 bytes aleatorios en hexadecimal, 64 caracteres | `AUT` |
| **`token_hash`** | SHA-256 del token, lo que se guarda en la BD. **El token en claro nunca se almacena** | `AUT` |
| **`used_at`** | Marca que vuelve el enlace no reutilizable | `AUT` |
| **Sesión** | Estado de autenticación. Con `SESSION_DRIVER=cookie` viaja cifrada en la cookie `dentalia_session` | `AUT` |
| **`APP_KEY`** | Clave AES-256-GCM que cifra la cookie de sesión y las cookies de Inertia | `AUT`, secretos |
| **Guard** | Comprobación de sesión de `@adonisjs/auth` (`web`, activado por defecto) | `AUT` |
| **CSRF / XSRF** | Token anti-falsificación. Sin él, `POST /logout` no destruye la sesión | `AUT`, `config/shield.ts` |
| **Guest** | Grupo de middleware que expulsa a quien ya tiene sesión (`/`, `/signup`, login) | `AUT` |
| **Flash** | Mensaje de un solo uso que viaja en la sesión y lo muestra `sonner` como toast | `AUT`, `ADM` |

## Arquitectura

| Término | Definición | Contexto |
|---|---|---|
| **Inertia** | Frontera entre servidor y React: el servidor devuelve HTML inicial y JSON en navegaciones posteriores | `05-api` |
| **Página Inertia** | Componente en `inertia/pages/` que el servidor nombra con `renderInertia()` | `05-api` |
| **Props** | Datos que el controller pasa a la página. Los comunes (`user`, `errors`) los comparte el middleware | `05-api` |
| **Prop compartido** | Prop presente en todas las páginas: `user`, `errors`, `flash` | `05-api` |
| **SSR** | Renderizado en servidor. **No se usa** (ADR-006) | `03-architecture` |
| **Tuyau** | Generador de cliente HTTP y registro de rutas con nombre. Montado, sin uso real | `05-api` |
| **Nombre de ruta** | Identificador estable (`insumos`, `session.destroy`) que el cliente usa con `<Link route="...">`. La URL puede cambiar; el nombre no | `05-api` |
| **ADR** | Registro de decisión de arquitectura: contexto, opciones, decisión y consecuencias | `03-architecture` |
| **HMR** | Recarga en caliente. Solo cubre `app/controllers/**` y `app/middleware/*.ts` | `07-development` |

## Base de datos

| Término | Definición | Contexto |
|---|---|---|
| **Conexión `sqlite`** | Base local en `tmp/db.sqlite3`. Guarda `users` y `magic_links` | `04-database` |
| **Conexión `supabase`** | PostgreSQL externo, **solo lectura**. Guarda el catálogo en el schema `dev` | `04-database` |
| **`searchPath`** | `['dev','public']`. Ejecuta `set search_path to 'dev','public'`, por eso los modelos no declaran `static schema` | `ADR-003` |
| **Migración** | Archivo en `database/migrations/` versionado en Git. Ejecutables | `04-database` |
| **`up()` / `down()`** | Crear y revertir una migración. `down()` existe y no se ha probado | `04-database` |
| **Seeder** | `database/seeders/main.ts`. Crea el usuario de pruebas con magic link habilitado | `04-database` |
| **Solo lectura** | La app no escribe nunca en Supabase: `migrations.paths: []` | `ADR-004` |
| **`escapeLike()`** | Escapa `%` y `_` antes de un `LIKE`. Sin ello, el usuario podría construir el comodín | `04-database` |
| **`withConnectionRetry()`** | Reintenta **una vez** la consulta ante un corte de conexión de Supabase | `ADR-001` |

## Calidad y proceso

| Término | Definición | Contexto |
|---|---|---|
| **As-built** | Documentar lo que el código **hace**, no lo que debería hacer | `00-project` |
| **Brecha** | Diferencia entre lo esperado y lo implementado. Se documenta, no se disfraza | Todas las secciones |
| **RFC** | Requisito funcional: qué debe hacer el sistema | `01-requirements` |
| **RNF** | Requisito no funcional: bajo qué condiciones | `01-requirements` |
| **AC** | Criterio de aceptación: cómo se comprueba un requisito | `01-requirements` |
| **SEC-nnn** | Requisito o hallazgo de seguridad | `06-security` |
| **TC-xxx-nnn** | Caso de prueba | `08-quality` |
| **Smoke por HTTP** | Verificación manual: peticiones con cookie de sesión, sin navegador | `08-quality` |
| **Lint** | ESLint con configuración plana de AdonisJS | `07-development` |
| **Typecheck** | `tsc --noEmit` sobre el servidor y, por separado, sobre Inertia | `07-development` |
| **Codegen** | `node ace codegen`: regenera `.adonisjs/**` y `database/schema.ts`. **Obligatorio** tras tocar rutas o modelos | `07-development` |
| **DRAFT → ANALYZED → … → DONE** | Ciclo de vida documental y de features | [`docs/README.md`](../README.md) |

## Referencias
- [Product brief](product-brief.md)
- [Alcance](scope.md)
- [Módulos](../02-functional-design/modules.md)
- [Diccionario de datos](../04-database/data-dictionary.md)
- [Catálogo de errores](../05-api/error-catalog.md)

## Brechas

- **El glosario no distingue el vocabulario de negocio del vocabulario técnico**: términos como
  "zona" o "módulo de salud" se definen por lo que implican para el producto, pero nadie del negocio
  los ha definido. La definición de "Zona" es provisional.
- **Faltan términos de negocio**: no hay glosario de los conceptos del dominio dental que el
  producto maneja, y sin él no se puede validar que las columnas del catálogo signifiquen lo que el
  sistema asume.
- **Sin glosario bilingüe**: si el equipo se incorpora con otro idioma, no hay traducción.
