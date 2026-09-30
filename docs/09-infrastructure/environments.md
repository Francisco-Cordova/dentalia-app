# Ambientes

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | `7bb5ecb` |

## Conclusión

**Solo existe DEV.** No hay TEST, ni UAT, ni PROD. Un único `.env` en la máquina del desarrollador
contiene todos los secretos.

## Matriz de configuración

| Configuración | DEV | TEST | UAT | PROD |
|---|---|---|---|---|
| **Existe** | **Sí** | No | No | No |
| URL | `http://localhost:3333` | — | — | — |
| `NODE_ENV` | `development` | — | — | — |
| `SESSION_DRIVER` | `cookie` | — | — | — |
| BD de auth | SQLite local `tmp/db.sqlite3` | — | — | — |
| Catálogo | Supabase real `dev."Insumos"` (solo lectura) | — | — | — |
| Correo | Mailtrap | — | — | — |
| `APP_KEY` | El del `.env` local | — | — | — |
| Datos reales | Sí: el catálogo real y correos reales | — | — | — |
| CORS | **Refleja cualquier origen** con `credentials` | — | — | Allowlist (vacía en el código) |
| Cookies `Secure` | No (porque `inProduction` es falso) | — | — | Sí |
| `debug` de errores | `true`: el detalle se muestra al usuario | — | — | `false`: página de error propia |
| CSP | Deshabilitada | — | — | Deshabilitada |
| HSTS | Activo (180 días) | Activo | Activo | Activo |
| Datos aislados | **No**: usa el Supabase de producción | — | — | — |

## Diferencias de comportamiento DEV vs PROD

`inProduction` se deriva de `NODE_ENV`. Cambiarlo cambia cinco cosas:

| Ajuste | DEV | PROD |
|---|---|---|
| Cookies `Secure` | No | **Sí**: sin HTTPS el login no funcionaría |
| `debug: true` | Muestra el stack del error al usuario | No |
| `renderStatusPages` | Puede mostrar la traza | Renderiza `errors/server_error.tsx` |
| CORS | `origin: true` (refleja) | `origin: []` (nada permitido) |
| Log del magic link en crudo | **Sí**, si SMTP falla | Solo si `inProduction` es falso |

La quinta fila es la trampa más importante: **`NODE_ENV=production` no es solo una Formalidad**. Sin
él, el token del enlace puede acabar en los logs del servidor.

## Preparación de un ambiente nuevo

Procedimiento necesario y **no ejecutado**. Requiere decisiones que no están tomadas (ver
[infrastructure.md](infrastructure.md)):

1. Crear el `.env` a partir de `.env.example` con valores propios del ambiente.
2. Generar un `APP_KEY` distinto por ambiente: `node ace generate:key`.
3. `npm install` y `node ace migration:run` sobre la base de datos de auth del ambiente.
4. `node ace db:seed` para tener el usuario de pruebas.
5. `npm run build` y verificar que `public/assets` existe.
6. `npm start` (`node bin/server.js`) con `NODE_ENV=production`.
7. Verificar `/insumos` con sesión: sin esto, un ambiente nuevo es un shellsin datos.

## El obstáculo: la base de datos de auth

| Problema | Consecuencia |
|---|---|
| SQLite es un archivo | Un despliegue con disco efímero (serverless, contenedor efímero) pierde `users` y `magic_links` |
| No hay alternativa implementada | `SESSION_DRIVER=database` **no funciona**: no existe la tabla `sessions` en ninguna migración |
| `migrations.paths` está vacío para Supabase | No se puede usar la tabla de auth en Postgres sin cambiar la configuración y crear las migraciones |
| El seeder crea un usuario de pruebas | Es el único camino probado para crear un usuario |

Resumen: **hoy no se puede desplegar a un ambiente con almacenamiento efímero** sin migrar el auth
a Postgres o montar un volumen persistente. Cualquier decisión de infraestructura pasa por esto.

## Referencias
- [Infraestructura](infrastructure.md)
- [Deployment](deployment.md)
- [Política de backup](backup-policy.md)
- [Entorno de desarrollo](../07-development/development-environment.md)
- [Seguridad: gestión de secretos](../06-security/secrets-management.md)

## Brechas

- **Un solo ambiente**: no hay forma de probar un cambio sin que afecte al catálogo real ni a los
  correos reales.
- **DEV usa datos de producción**: las consultas de `/insumos` leen `dev."Insumos"` real. Un cambio
  con error podría afectar la carga, aunque la conexión sea de solo lectura.
- **Sin separación de credenciales**: no se puede saber qué credencial de Supabase se usa ni quién la
  emitió.
- **Sin configuración separada de correo**: un error de `MAIL_FROM` en DEV llega al destinatario real.
- **El bloqueo de SQLite impide casi cualquier despliegue moderno**: es la brecha que condiciona
  toda la infraestructura futura.
- **Sin `APP_KEY` documentado por ambiente**: no se sabe cuántos existen ni cuál está en uso.
