# Integration Testing

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Estado

**No hay tests de integración.** No existe ningún `*.spec.ts`. Lo que sí existe son verificaciones
manuales por HTTP, documentadas en [test-cases.md](test-cases.md), ejecutados sobre el servidor de
desarrollo con `npm run dev`.

## Integraciones que habría que cubrir

| Integración | Método | Estado | Riesgo si se rompe |
|---|---|---|---|
| SQLite ↔ modelos Lucid (`users`, `magic_links`) | Especificaciones de Lucid + `apiClient` | **Sin cubrir** | Login imposible; el único camino de acceso |
| Magic link: controlador → hash → `used_at` → sesión | Spec de ruta | **Sin cubrir** | Fallo de autenticación |
| Supabase `dev."Insumos"` vía Lucid | Spec de modelo con la conexión real (solo lectura) | **Sin cubrir** | `/insumos` vacío o con error |
| `withConnectionRetry()` | Spec unitario de la función | **Sin cubrir** | Errores tras inactividad |
| Inertia: controller → `renderInertia` → props | Spec de ruta + aserción del HTML/JSON | **Sin cubrir** | Pantalla en blanco o props con otro nombre |
| Registro de rutas Tuyau (`.adonisjs/client/registry`) | Comparar el registro con `start/routes.ts` | **Sin cubrir** | Rotura silenciosa de `<Link route="x">` |
| SMTP (Mailtrap) | Spec con el transporte simulado | **Sin cubrir** | El enlace nunca llega |
| CORS y Shield | Spec de cabeceras de respuesta | **Sin cubrir** | Control de seguridad ausente en otro ambiente |
| `@adonisjs/auth` (session store, guard) | Spec de `middleware.auth()` | **Sin cubrir** | Panel accesible sin sesión |

## Datos de prueba

No hay set de datos, ni seeder de pruebas, ni factoría de usuarios. Lo que se usa hoy:

| Recurso | Cómo se prepara hoy | Problema |
|---|---|---|
| Usuario de auth | `node ace db:seed` crea uno (magic link habilitado) | Un único usuario fijo, compartido por todos los que desarrollen |
| Sesión | Insertando un token en `tmp/db.sqlite3` y calculando su SHA-256 | Procedimiento manual y frágil; hay que calcular el hash a mano |
| Catálogo | `dev."Insumos"` real (~5.060 filas), conexión de solo lectura | No se puede fijar el contenido: un caso que dependa de un producto concreto se rompe si el catálogo cambia |
| Datos corruptos | A mano sobre `tmp/db.sqlite3` | Sin aislamiento; un caso puede dejar la BD en un estado que rompe el siguiente |

Ninguna de estas situaciones es automatizable tal como está.

## Casos críticos

Verificados a mano (no automatizados), de mayor a menor valor de cubrir:

1. Consumir un magic link **una sola vez** (TC-AUT-003/004): si `used_at` no se respetara, un
   enlace filtrado daría acceso indefinido.
2. `POST /logout` con y sin XSRF (TC-AUT-009/010).
3. Un correo no registrado no crea usuario ni envía correo (TC-AUT-002): es lo que impide que el
   login se convierta en un enumerador de correos válidos.
4. `/insumos` con `escapeLike()` y con `page` fuera de rango (TC-INS-005/004).
5. El prop de error del magic link inválido: la página debe mostrar el mensaje y no reventar
   (TC-AUT-004/005).
6. Que una ruta protegida sin sesión redirija a `/` y no ejecute el controller (TC-SEC-006).

## Referencias
- [Estrategia de pruebas](test-strategy.md)
- [Casos de prueba](test-cases.md)
- [E2E testing](e2e-testing.md)
- `tests/bootstrap.ts`, `database/seeders/main.ts`, `app/services/with_connection_retry.ts`

## Brechas

- **Cobertura de integración cero** en las nueve integraciones del inventario.
- **Los datos de prueba dependen del catálogo real de producción**: los specs de `/insumos` no
  pueden afirmar sobre datos concretos, y un fallo de red contra Supabase haría fallar la suite
  entera.
- **No hay aislamiento de la base de datos de auth**: los specs correrían contra `tmp/db.sqlite3`,
  la misma que usa el desarrollo; cualquier limpieza destructiva afecta el entorno local.
- **No hay forma de simular el fallo de SMTP** sin tocar el código del controlador.
- **`@japa/database-lucid` no está instalado**: la integración SQLite↔Lucid exigiría añadir la
  dependencia.
