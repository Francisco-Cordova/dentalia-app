# Troubleshooting

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | `7bb5ecb` |

## El servidor no arranca

**Señales:** `EADDRINUSE`, o el puerto no responde.

**Diagnóstico:**
1. ¿El puerto 3333 está ocupado?
   ```bash
   netstat -ano | findstr :3333
   ```
2. ¿Hay otro proceso `node` colgado?
   ```bash
   tasklist | findstr node
   ```

**Resolución:**
1. Detener el proceso que ocupa el puerto:
   ```bash
   Stop-Process -Id <pid>
   ```
2. Arrancar de nuevo: `npm run dev`

**Escalar cuando:** el puerto queda libre pero el error persiste.

---

## Falla la autenticación SCRAM contra Supabase

**Señales:**
```
SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
```

**Diagnóstico:** la cadena de conexión no incluye la contraseña. Es el error más común al configurar
el entorno por primera vez.

**Resolución:** `SUPABASE_DB_URL` debe tener esta forma completa:
```
postgresql://postgres.<ref>:<PASSWORD>@<host>:5432/postgres
```
Si el proyecto se copia de la consola de Supabase, es habitual pegar la versión sin contraseña.

**Verificación:** `node ace repl` y ejecutar una consulta, o arrancar el servidor y abrir
`/insumos`.

---

## Nadie recibe el magic link

**Señales:** `POST /login/magic` responde 302, no llega ningún correo.

**Diagnóstico — en este orden:**

1. **¿El usuario existe?** El magic link **no crea usuarios**. Si el correo no está en `users`, no
   se envía nada y no se crea fila en `magic_links` (respuesta idéntica, por diseño).
   ```bash
   sqlite3 tmp/db.sqlite3 "SELECT email FROM users;"
   ```
2. **¿Falló SMTP?** Buscar en el log:
   ```bash
   Select-String -Path tmp\serve.log -Pattern "Error al enviar el magic link"
   ```
3. **¿Estamos en DEV?** Si `NODE_ENV` no es `production` y el envío falló, la URL completa está
   en el log:
   ```bash
   Select-String -Path tmp\serve.log -Pattern "MAGIC LINK DEV"
   ```

**Resolución:** crear el usuario (`node ace db:seed`) o corregir las credenciales SMTP en `.env`
(`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`).

**Escalar cuando:** el log muestra un error de SMTP y las credenciales son correctas.

---

## El enlace dice "inválido o ya expiró"

**Señales:** `/` muestra *"El enlace es inválido o ya expiró. Solicita uno nuevo."*

**Diagnóstico — tres causas reales, ninguna da información al usuario:**

| Causa | Cómo comprobarla |
|---|---|
| Ya se usó | `SELECT used_at FROM magic_links WHERE token_hash = '<sha256 del token>';` |
| Pasaron los 30 min | `SELECT expires_at FROM magic_links WHERE token_hash = '...';` |
| El token nunca existió (truncado al copiar) | El `token_hash` calculado del token recibido no coincide con ninguna fila |

El mensaje es idéntico en los tres casos, deliberadamente: no revela si el enlace existió.

**Resolución:** pedir un enlace nuevo.

**Escalar cuando:** ocurre repetidamente con enlaces recién recibidos.

---

## `connection terminated unexpectedly` al navegar el catálogo

**Señales:** el log muestra `connection terminated`, `connection ended`, `socket hang up`,
`ECONNRESET`, `not queryable` u otros de la lista de `withConnectionRetry()`.

**Diagnóstico:** Supabase cerró una conexión inactiva. El pool entrega un socket muerto.

**Resolución:** el helper **ya reintenta una vez** y, en el caso normal, la consulta sale bien al
segundo intento. Si el error persiste:

1. Comprobar la conectividad desde la máquina:
   ```bash
   Test-NetConnection -ComputerName <host-supabase> -Port 5432
   ```
2. Revisar la URL: si cambió, hay que reiniciar el servidor (cambios en `.env` no se aplican con
   HMR).

**Escalar cuando:** `Test-NetConnection` falla de forma sostenida: el problema es del proveedor.

---

## `/insumos` no carga o la tabla sale vacía

**Señales:** 500, o 200 con cero filas.

**Diagnóstico:**
1. ¿La sesión sigue viva? `/insumos` sin sesión redirige a `/` (no da 500).
2. ¿El catálogo tiene datos?
   ```sql
   SELECT count(*) FROM dev."Insumos";
   ```
3. ¿El filtro activo es demasiado restrictivo? La barra de búsqueda persiste entre visitas
   (`?nombre=` y `?codigo=`). Una página vacía puede ser una búsqueda sin resultados, no un error.

**Resolución:** quitar los filtros de la URL y recargar.

**Escalar cuando:** `count(*)` devuelve 0 en Supabase: la tabla se vació o cambió de schema.

---

## Los enlaces del sidebar no funcionan

**Señales:** clic en "Familias" o "Kits" y nada pasa, o un error de consola.

**Causa más probable:** la ruta perdió su `.as()` en `start/routes.ts`, y por tanto su nombre
ya no existe en `.adonisjs/client/registry`. Es un fallo silencioso en desarrollo.

**Diagnóstico:**
```bash
Select-String -Path .adonisjs\client\registry\index.ts -Pattern "familias|kits"
```

**Resolución:**
```bash
# restaurar el .as() en start/routes.ts
node ace codegen
```

**Prevención:** ver la sección "Rutas y codegen" de
[code-review-checklist.md](../07-development/code-review-checklist.md).

---

## El formulario del buscador no busca al pulsar Enter

**Señales:** se escribe un término, se pulsa Enter y no ocurre nada.

**Causa:** un `<form>` con 2+ inputs y sin botón submit **no** hace implicit submission en
navegadores modernos. Por eso `inertia/pages/insumos.tsx` intercepta `onKeyDown`.

**Resolución:** usar el botón de búsqueda, o verificar que el `onKeyDown` sigue montado.

---

## El layout se rompe en pantallas o componentes nuevos

**Señales:** los campos de un formulario se apilan en vertical aunque se espere en horizontal.

**Causa:** dos reglas globales en `inertia/css/app.css` afectan a **todo** el markup:
- `form { flex-direction: column }`
- `label { display: block }`

**Resolución:** añadir el override en el CSS del componente, como hace `.insumos-toolbar { flex-direction: row }`.

**Prevención:** ver [ADR-005](../03-architecture/adr/ADR-005-css-propio-sin-tailwind.md) y la
sección de estilos en [development-guidelines.md](../07-development/development-guidelines.md).

---

## `Cannot find module` o errores de tipos tras tocar rutas o modelos

**Señales:** el typecheck falla con imports de `#generated/*` o tipos de ruta inexistentes.

**Causa:** `.adonisjs/**` y `database/schema.ts` son generados. Un cambio en rutas o modelos
obliga a regenerarlos.

**Resolución:**
```bash
node ace codegen
npm run typecheck
```

---

## Cambios en `.env`, `config/` o modelos no tienen efecto

**Señales:** se corrige un valor y el comportamiento sigue igual.

**Causa:** el HMR solo cubre `app/controllers/**` y `app/middleware/*.ts`
(`package.json` → `hotHook.boundaries`).

**Resolución:** reiniciar `npm run dev`.

---

## Sesión perdida de golpe entre recargas

**Señales:** el usuario vuelve a `/` sin motivo.

**Causas:**
1. `APP_KEY` cambió (o `.env` se regeneró): invalida todas las cookies.
2. La sesión venció: 2 horas de inactividad (`config/session.ts`).
3. El navegador borró la cookie: `httpOnly`, `sameSite: lax`, y en DEV **no** tiene `secure`, así que
   un navegador puede decidir no guardarla en un contexto no-HTTPS.

**Diagnóstico:** comparar el `APP_KEY` con el del `.env` que se usó al iniciar sesión.

**Resolución:** volver a pedir el enlace.

---

## Referencias
- [Runbook](runbook.md)
- [Entorno de desarrollo](../07-development/development-environment.md)
- [Catálogo de errores](../05-api/error-catalog.md)
- [Integraciones](../03-architecture/integrations.md)
- [Respaldo y recuperación](../04-database/backup-recovery.md)

## Brechas

- **No hay registro de incidentes**: no se sabe con qué frecuencia ocurre cada uno de estos
  síntomas.
- **El diagnóstico depende de leer el código**: no hay logs de negocio, así que muchos pasos
  obligan a inspeccionar `tmp/db.sqlite3` a mano.
- **Sin causa raíz documentada**: estas soluciones son el procedimiento usado ad hoc, no un
  conocimiento acumulado de causa-efecto.
- **Falta la mitad de los fallos posibles**: los escenarios de infraestructura y despliegue no
  tienen escenario de diagnóstico porque nunca han ocurrido.
- **Sin runbook de PROD**, porque no hay PROD.
