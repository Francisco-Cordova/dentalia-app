# Runbook

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | `7bb5ecb` |

## Servicio

| Aspecto | Valor |
|---|---|
| Qué es | Panel web de consulta del catálogo de insumos, con acceso por magic link |
| Proceso | Un único proceso Node (`bin/server.ts` o `node ace serve --hmr`) |
| Puerto | `3333` (`PORT` en `.env`) |
| Base de datos de auth | SQLite en `tmp/db.sqlite3` |
| Catálogo | Supabase `dev."Insumos"` (externo, solo lectura) |
| Correo | SMTP de Mailtrap (externo) |
| Carga útil | `tmp/serve.log` |
| Entornos | Solo DEV |

## Salud

### Verificación manual

No hay health check. Estos son los comandos para comprobar el estado:

```bash
# 1. ¿Vive el proceso?
netstat -ano | findstr :3333

# 2. ¿Responde la raíz?
curl -I http://localhost:3333/

# 3. ¿Responde una ruta protegida (debe redirigir a /)?
curl -I http://localhost:3333/skus

# 4. ¿Está sana la base de auth?
sqlite3 tmp/db.sqlite3 ".tables"
sqlite3 tmp/db.sqlite3 "SELECT count(*) FROM users;"

# 5. ¿Hay tokens pendientes sin usar?
sqlite3 tmp/db.sqlite3 "SELECT count(*) FROM magic_links WHERE used_at IS NULL;"
```

| Resultado | Significado |
|---|---|
| Puerto sin escucha | El proceso está caído |
| `curl /` devuelve 200 | El servidor vive; **no dice nada del correo ni de Supabase** |
| `/skus` devuelve 302 a `/` | Correcto: es el comportamiento sin sesión |
| `.tables` no lista `users` | Faltan migraciones: `node ace migration:run` |
| Logs con `connection terminated` | Supabase cortó la conexión; `withConnectionRetry()` reintenta una vez |

### Lo que **no** se puede comprobar

| Signal | Por qué |
|---|---|
| Si el correo se está entregando | No hay registro de envíos exitosos |
| Si Supabase responde | Solo se ve al navegar `/insumos` |
| Si el error de una petición fue de negocio o de infraestructura | El log de petición solo tiene el status |

## Operaciones frecuentes

### Arrancar

```bash
npm run dev
```

Si el puerto está ocupado:

```bash
netstat -ano | findstr :3333
Stop-Process -Id <pid>
```

### Reiniciar

Único procedimiento real: matar el proceso y volver a arrancarlo.

```bash
# Ctrl+C en la terminal del servidor, o:
netstat -ano | findstr :3333
Stop-Process -Id <pid>
npm run dev
```

Con `managedByPm2` (`bin/server.ts` gestiona `SIGINT` en ese caso) el reinicio sería distinto, pero
**nunca se ha corrido bajo PM2**.

### Recuperar el login

Síntoma: nadie recibe el enlace.

```bash
# 1. Confirmar que el usuario existe: el magic link NO crea usuarios
sqlite3 tmp/db.sqlite3 "SELECT id, email FROM users;"

# 2. Si no existe, crearlo
node ace db:seed          # crea el usuario de pruebas

# 3. Si SMTP falla en DEV, el token está en el log
Select-String -Path tmp\serve.log -Pattern "MAGIC LINK DEV"
```

El paso 3 es la vía real de desarrollo: el log del controlador imprime la URL cuando el envío
falla y `inProduction` es falso.

### Reinicializar la base de auth

**Pérdida total de cuentas.** Solo si el archivo se corrompió:

```bash
# Copiar antes de tocar nada
Copy-Item tmp\db.sqlite3 tmp\db.sqlite3.bak
node ace migration:run
node ace db:seed
```

### Añadir un usuario

No hay interfaz de administración. Las dos vías:

```bash
node ace db:seed                                  # usuario de pruebas, magic link habilitado
# o
# el autoregistro: escribir /signup en el navegador (no enlazado desde el login)
```

### Ver el catálogo

```sql
-- en Supabase, para confirmar que el catálogo existe
SELECT count(*) FROM dev."Insumos";
```

## Escalamiento

| Severidad | Responsable | Tiempo objetivo | Canal |
|---|---|---|---|
| **SEV-1** · Nadie puede entrar | Dev owner | Inmediato | No definido |
| **SEV-2** · El catálogo no carga | Dev owner | Mismo día | No definido |
| **SEV-3** · Degradación parcial | Dev owner | Sin definir | No definido |
| **Dependencia caída** (Supabase, Mailtrap) | El proveedor | **No se puede escalar**: no hay contacto registrado | — |

La tabla de escalamiento está vacía en la práctica: no hay nombres, ni canales, ni turnos. El único
contacto posible es quien esté mirando el código.

## Referencias
- [Troubleshooting](troubleshooting.md)
- [Monitoreo](../09-infrastructure/monitoring.md)
- [Entorno de desarrollo](../07-development/development-environment.md)
- [Gestión de incidentes](incident-management.md)
- [Respaldo y recuperación](../04-database/backup-recovery.md)

## Brechas

- **Sin health check**: no hay forma de consultar el estado desde fuera del proceso.
- **Sin proceso de reinicio**: reiniciar es matar y arrancar a mano.
- **Sin procedimiento de alta de usuarios**: dar de alta a alguien requiere tocar la base de datos.
- **Sin canal de escalamiento**: no hay a quién llamar, ni dónde notificar.
- **Los contactos de los proveedores no están registrados**: si Supabase o Mailtrap caen, no hay a quién
  reclamar.
- **Sin logs de negocio**: solo hay dos llamadas al logger en toda la aplicación.
- **No hay runbook para PROD**, porque no hay PROD.
