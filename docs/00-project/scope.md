# Alcance

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | `7bb5ecb` |

> Reconstrucción a partir del código. No existe un documento de alcance redactado por el negocio;
> lo que no se puede verificar está en `## Brechas`, no inventado.

## En alcance

### Funcionalidad implementada y verificada

| # | Elemento | Evidencia |
|---|---|---|
| 1 | Login sin contraseña por enlace mágico de un solo uso, con expiración de 30 min | `magic_link_controller.ts`; verificado por HTTP |
| 2 | Almacenamiento del token **hasheado** (SHA-256), nunca en claro | `magic_links.token_hash` |
| 3 | Protección de las 9 rutas del panel con `middleware.auth()` | `start/routes.ts` |
| 4 | Cierre de sesión con CSRF | `session_controller.ts` + `config/shield.ts` |
| 5 | Consulta del catálogo de insumos con paginación de 10 | `insumos_controller.ts` |
| 6 | Buscador por nombre y por código, con `escapeLike()` | `InsumosController` |
| 7 | Reconexión ante cortes de Supabase | `withConnectionRetry.ts` |
| 8 | Shell del panel: sidebar colapsable, sección activa, menú de usuario, toasts | `inertia/layouts/admin.tsx` |
| 9 | Fidelidad visual con el catálogo público de Dentalia | `Plantillas/` |
| 10 | Páginas de error propias (404 y 500) | `inertia/pages/errors/` |

### Alcance de las páginas de dominio

Las 8 páginas de dominio del panel existen y replican el diseño, pero **1 no tiene detrás una fuente
de datos**:

| Página | Datos |
|---|---|
| `/insumos`, `/skus`, `/kits`, `/zonas`, `/modulos-de-salud` | **Reales** (Supabase, solo lectura) |
| `/usuarios` | **Reales** (SQLite, `users`, la misma tabla de la autenticación) |
| `/familias` | Array hardcodeado en el propio `.tsx` |

La que sigue con array hardcodeado (`/familias`) está en alcance como **interfaz**. No lo está como
funcionalidad: mover un slider, paginar o buscar en ella no cambia nada porque no hay consulta.

### También en alcance

- Acceso al catálogo en **solo lectura** desde esta app.
- Migraciones de `users` y `magic_links` sobre SQLite local.
- Autenticación por correo vía SMTP.

## Fuera de alcance

| # | Elemento | Motivo |
|---|---|---|
| 1 | Escritura, alta o edición de insumos | El catálogo es externo y de solo lectura (ADR-004). `migrations.paths: []` en la conexión `supabase` |
| 2 | Gestión de usuarios (alta por admin, edición, baja, roles) | `/usuarios` solo **lista**; el magic link **exige** usuario previo y no lo crea, así que el alta sigue sin existir |
| 3 | Autorización por rol o permiso | No existe el modelo. `middleware.auth()` es binario |
| 4 | API REST / OpenAPI | Ninguna ruta devuelve JSON. `providers/api_provider.ts` y Tuyau están montados pero sin endpoints |
| 5 | Recovery de contraseña y MFA | No existen. El magic link no es un recovery: requiere usuario registrado |
| 6 | Multi-tenant | Una sola clínica, un solo proyecto de Supabase |
| 7 | Datos de pacientes o información clínica | No hay datos de pacientes en el sistema |
| 8 | SSR | Inertia renderiza en cliente (ADR-006) |
| 9 | App móvil | No hay cliente |
| 10 | Reportes, exportaciones, métricas de negocio | No existen |
| 11 | Multi-idioma | Todo el texto está en español, fijo en el código |
| 12 | Despliegue y operación en producción | Sin infraestructura. Ver [deployment.md](../09-infrastructure/deployment.md) |
| 13 | Tests automatizados | Fuera de alcance **de facto**: no hay ninguno escrito |

## Supuestos

Supuestos que el código da por ciertos y que nadie ha validado:

| # | Supuesto | Qué pasa si es falso |
|---|---|---|
| 1 | **Solo lectura a `dev."Insumos"` es suficiente** | Si hay que crear o editar insumos, hace falta una vía de escritura y cambiar ADR-004 |
| 2 | **El catálogo es público** | Si hay datos sensibles, hay que reclasificar y Possibly restricting Supabase (ver [clasificación](../06-security/data-classification.md)) |
| 3 | **Existe una persona autorizada a crear los usuarios** | Hoy el único camino real es `node ace db:seed` o el autoregistro de `/signup` |
| 4 | **Un enlace enviado por correo es un control de acceso suficiente** | Sin rate limiting, el correo es un vector de ataque (SEC-007) |
| 5 | **Un único `APP_KEY` compartido entre cifrado y sesiones es aceptable** | Filtrarlo compromete ambos usos |
| 6 | **Que toda persona con sesión pueda ver todo el panel es correcto** | Habría que introducir roles antes de que exista información sensible |
| 7 | **`tmp/db.sqlite3` en el disco del desarrollador es aceptable como almacén de usuarios** | Sin respaldo: perder el archivo elimina todas las cuentas |
| 8 | **Mantener la réplica visual del catálogo público de Dentalia** | Si el diseño se aleja, hay que revisar las decisiones de CSS propio (ADR-005) |
| 9 | **Que las páginas de dominio hardcodeadas sirvan de esqueleto** | Al pasar a datos reales, cada página necesitará su modelo y su consulta |

## Dependencias

| # | Dependencia | Riesgo | Mitigación |
|---|---|---|---|
| 1 | Proyecto Supabase con la tabla `dev."Insumos"` | Alto: sin él, `/insumos` no funciona | Fallar de forma ruidosa al arrancar si falta la URL |
| 2 | Acceso de red al Supabase **sin cortes prolongados** | Alto | `withConnectionRetry()` cubre un corte, no una caída prolongada |
| 3 | SMTP (Mailtrap en DEV) | Alto: sin correo no hay login | El log `[MAGIC LINK DEV]` es el fallback |
| 4 | `users` precargadas | Alto: el magic link no crea usuarios | — |
| 5 | `APP_KEY` estable entre reinicios | Alto: rotarla invalida todas las sesiones | — |
| 6 | Node.js ≥ 24 con módulos nativos compilados | Medio | Fallar en `npm install` |
| 7 | Plantillas HTML de Dentalia | Bajo: solo referencia de diseño | — |

## Restricciones

| Tipo | Restricción |
|---|---|
| Técnica | Catálogo inmutable desde la app |
| Técnica | Una sola BD de auth, local y gitignored |
| Técnica | Sin CI ni tests: la verificación es manual |
| Técnica | Sin ambientes separados: no se puede probar un cambio contra datos de otro entorno |
| Dependencia | Supabase, SMTP y Node del desarrollador |
| Diseño | La UI replica el HTML público de Dentalia, incluidas sus limitaciones |
| Seguridad | CORS refleja cualquier origen en DEV: **nunca desplegar con `NODE_ENV=development`** |
| Negocio | Desconocidas: no hay documento de restricciones de negocio |
| Legal | Desconocidas: no hay política de retención ni clasificación acordada |

## Referencias
- [Product brief](product-brief.md)
- [Módulos](../02-functional-design/modules.md)
- [Catálogo de insumos](../features/FEATURE-001-catalogo-insumos.md)
- [Usuarios](../features/FEATURE-006-usuarios.md)
- [Autenticación magic link](../features/FEATURE-002-autenticacion-magic-link.md)
- [ADR-004: catálogo de solo lectura](../03-architecture/adr/ADR-004-catalogo-solo-lectura.md)
- [Entornos](../09-infrastructure/environments.md)

## Brechas

- **El alcance no está validado por negocio**: nadie ha dicho qué se espera del producto, así que
  la frontera entre "en alcance" y "fuera de alcance" es una inferencia del código.
- **El alcance incluye pantallas sin datos reales**: 7 de las 8 páginas de dominio ya leen de una
  fuente real, pero **familias** sigue en alcance como interfaz y eso puede leerse como
  funcionalidad. Si el cliente espera ver familias con datos, el alcance real está incumplido.
- **No hay alcance para las operaciones**: no se ha definido quién administerá el sistema, ni con
  qué procedimiento se incorporan usuarios.
- **Los supuestos no están verificados**: en particular el #3 (existe una persona autorizada a crear
  usuarios) es load-bearing: si es falso, nadie puede entrar al sistema.
- **El supuesto #2 puede tener consecuencias legales**: tratar el catálogo como público sin acuerdo
  escrito con el proveedor de los datos es una decisión tomada por omisión.
