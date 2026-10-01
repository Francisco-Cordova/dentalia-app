# Vista general de la API

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Advertencia de alcance

**No existe API REST.** El sistema no expone JSON de negocio ni consume una API externa. Su
frontera es la de **Inertia**: el navegador pide páginas y el servidor responde HTML (primera
carga) o JSON (navegaciones posteriores). Este documento describe esa frontera real.

Lo que sí existe y es JSON:
- La respuesta de Inertia en navegaciones (`props`, `url`, `version`).
- Un cliente HTTP generado (`@tuyau/core` + `providers/api_provider.ts`) que **ninguna** ruta
  alimenta: está montado y sin uso.

## Inventario de endpoints

14 rutas en `start/routes.ts`; las 14 tienen nombre en el registro de Tuyau (`.adonisjs/client/registry`). Un nombre perdido rompe cualquier `route(...)` que lo referencie, sin que el typecheck del servidor lo detecte.

### Públicas (grupo `guest`, requiere NO tener sesión)

| Método | Ruta | Nombre | Handler | Respuesta |
|---|---|---|---|---|
| GET | `/` | `session.create` | `SessionController.create` | Inertia `auth/login` |
| GET | `/signup` | `new_account.create` | `NewAccountController.create` | Inertia `auth/signup` |
| POST | `/signup` | `new_account.store` | `NewAccountController.store` | 302 a `/skus` |
| POST | `/login/magic` | `magic_link.send` | `MagicLinkController.send` | 302 atrás + flash |
| GET | `/auth/magic/:token` | `magic_link.verify` | `MagicLinkController.verify` | 302 a `/skus` |

### Protegidas (grupo `auth`, requiere sesión)

| Método | Ruta | Nombre | Handler | Props |
|---|---|---|---|---|
| GET | `/skus` | `skus` | `renderInertia` | `{}` (mock) |
| GET | `/familias` | `familias` | `renderInertia` | `{}` (mock) |
| GET | `/insumos` | `insumos` | `InsumosController.index` | `insumos`, `total`, `page`, `lastPage`, `nombre`, `codigo` |
| GET | `/kits` | `kits` | `KitsController.index` | `kits[]`, `total`, `page`, `lastPage`, `nombre`, `codigo` |
| GET | `/usuarios` | `usuarios` | `renderInertia` | `{}` (mock) |
| GET | `/zonas` | `zonas` | `ZonasController.index` | `zonas[]`, `total`, `page`, `lastPage`, `nombre` |
| GET | `/modulos-de-salud` | `modulosDeSalud` | `ModulosSaludController.index` | `modulos[]`, `total`, `page`, `lastPage`, `nombre` |
| GET | `/home` | `home` | `renderInertia` | `{}` (mock) |
| POST | `/logout` | `session.destroy` | `SessionController.destroy` | 302 a `/` |

Las páginas que siguen en mock registran **solo GET** vía `router.on(...)`: se verificó que POST,
PUT, DELETE y PATCH devuelven 404. `/insumos`, `/kits`, `/zonas` y `/modulos-de-salud` usan
`router.get(...)` con un handler, y tampoco aceptan más métodos.

Query params de `/insumos` y `/kits`: `page`, `nombre`, `codigo`. De `/zonas` y
`/modulos-de-salud`: `page`, `nombre`.

## Handlers sin ruta

| Handler | Método | Estado |
|---|---|---|
| `SessionController` | `store` (login por contraseña) | **Código muerto**: no hay ruta ni enlace en la UI |

`loginValidator` (`app/validators/user.ts:28`) solo lo usa ese método, así que también es código
inalcanzable.

## Convenciones

- **Navegación por nombre de ruta**, no por URL: `<Link route="insumos">` y
  `useRouter().get({ route: 'insumos', qs })`. Los nombres viven en `.adonisjs/client/registry`.
- **Estado en la query string**: filtros y página viajan como `qs` (`nombre`, `codigo`, `page`).
- **Props planas**: el controller devuelve campos sueltos, no un objeto `paginate()` crudo.
- **Sin API versionada**: no hay `/api/v1`, ni negotiated content, ni OpenAPI
   (ver [Brechas](../README.md)).

## Referencias
- [Contratos HTTP](http-contracts.md)
- [Flujos](../02-functional-design/flows/)
- [Índice documental](../README.md)
- `start/routes.ts`, `.adonisjs/client/registry/index.ts`

## Brechas

- **Sin OpenAPI**: no hay contrato de API generado ni mantenido a mano.
- **Sin API de negocio**: cualquier consumidor externo (app móvil, otro panel, integración) exigiría
  diseñarla desde cero; hoy solo existe la frontera Inertia.
- **Cliente HTTP generado sin uso**: `providers/api_provider.ts` y `@tuyau/core` están montados y
  ningún endpoint los alimenta. Es andamiaje preparado que puede confundir a quien lo lea.
- **Sin versionado de `props`**: no hay `InertiaOptions.version`, así que un HTML cacheado con
  assets viejos no se invalida.
- **Sin CSP** que restrinja qué puede cargar el bundle (ver [requisitos de seguridad](../06-security/security-requirements.md)).
- **Errores de validación**: en navegaciones Inertia llegan en el prop compartido `errors`
  (`ctx.inertia.always(...)`); no hay cuerpo JSON de error estándar.
