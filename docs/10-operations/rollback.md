# Rollback

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | `7bb5ecb` |

## Cuándo ejecutar

Un rollback se justifica cuando el cambio desplegado deja el sistema **peor que antes**. Los
disparadores concretos de este proyecto:

| Disparador | Severidad | Ejemplo |
|---|---|---|
| El panel no arranca | SEV-1 | Error de `start/env.ts` por una variable mal formada |
| Nadie puede entrar al panel | SEV-1 | `APP_KEY` regenerada sin querer; `SESSION_DRIVER` cambiado a `database` (no hay tabla `sessions`) |
| `node ace codegen` no ejecutado tras tocar rutas | SEV-2 | Enlaces rotos, 404 en el registro de Tuyau |
| `/insumos` falla | SEV-2 | `searchPath` mal, `SUPABASE_DB_URL` incorrecta, el error de SCRAM |
| Migración aplicada a medias | SEV-1 | `users` o `magic_links` incompletas |

Regla práctica: si el rollback no está claro en menos de 10 minutos, es mejor un *forward fix*.

## Aplicación

### Código

```bash
# 1. Ver qué hay sin publicar
git status
git log --oneline -5

# 2. Volver al commit anterior (el anterior al del despliegue)
git revert <commit>        # preferred: conserva el historial
# o, si el commit nunca se publicó:
git reset --hard <commit>  # solo si no hay trabajo sin commitear

# 3. Si se tocaron rutas o modelos: OBLIGATORIO
node ace codegen

# 4. Verificar antes de reiniciar
npm run lint
npm run typecheck

# 5. Reconstruir assets
npm run build

# 6. Reiniciar
npm start
```

**`node ace codegen` no es opcional en el paso 3.** Sin él, el typecheck puede pasar y el registro de
rutas queda desalineado, dejando enlaces rotos.

### Estado local

No hay infraestructura que revertir: no hay contenedores, ni PM2, ni sistema de versiones de
release. El "rollback de infraestructura" es **desinstalar lo instalado a mano**.

## Base de datos

### Rollback vs forward-fix

En AdonisJS, `migration:down()` deshace la migración. Pero el criterio debe ser explícito:

| Situación | Decisión | Motivo |
|---|---|---|
| La migración solo añade una tabla nueva que aún no tiene datos | **Rollback** (`node ace migration:rollback`) | `down()` la elimina; no hay nada que perder |
| La migración ya tiene datos de producción | **Forward-fix** | Un `down()` puede perder datos. Escribir una migración nueva que corrija |
| La migración modificó una columna con datos | **Forward-fix** | Revertir la definición no revierte los datos ya escritos |
| Falla el `up()` a mitad | **Forward-fix** | La migración queda sin aplicar del todo; escribir una que corrija el estado |

Regla: **el rollback de esquema solo es seguro cuando no hay datos**. En cuanto los hay, se corrige
hacia adelante.

### Verificación tras un cambio de esquema

```bash
# Estado de las migraciones
node ace migration:status

# Que las tablas esperadas existan con las columnas esperadas
sqlite3 tmp/db.sqlite3 ".schema users"
sqlite3 tmp/db.sqlite3 ".schema magic_links"

# Que no haya filas huérfanas en magic_links (FK a users)
sqlite3 tmp/db.sqlite3 "SELECT count(*) FROM magic_links WHERE user_id NOT IN (SELECT id FROM users);"
```

### Lo que nunca se puede revertir

| Dato | Por qué |
|---|---|
| Correos enviados | El magic link ya salió a la bandeja; un rollback no lo retira. El token caduca a los 30 min y el `used_at` impide reutilizarlo |
| Cookies de sesión emitidas | Viven en el navegador. Rotar `APP_KEY` es la única forma de invalidarlas |
| Filas de `magic_links` | No hay purga: la tabla solo crece |

### Supabase

**No hay rollback posible.** La conexión es de solo lectura y `migrations.paths` está vacío: la app
nunca escribe en Supabase. Un problema de catálogo se resuelve en Supabase, no desde aquí.

## Verificación posterior

- [ ] El proceso arranca sin error
- [ ] `GET /` responde 200
- [ ] `GET /skus` **sin sesión** responde 302 a `/`
- [ ] El login por magic link funciona: llega el correo y se consume una sola vez
- [ ] `GET /insumos` **con sesión** responde 200 con 10 filas
- [ ] Los 9 enlaces del sidebar navegan (o devuelven su página)
- [ ] `npm run lint` y `npm run typecheck` en verde
- [ ] `node ace migration:status` sin migraciones pendientes
- [ ] `git status` limpio: no quedó nada a medias
- [ ] `.adonisjs/` coincide con `start/routes.ts`
- [ ] Se ha registrado qué pasó y por qué se revirtió

## Referencias
- [Runbook](runbook.md)
- [Definición de terminado](../07-development/definition-of-done.md)
- [Estrategia de migraciones](../04-database/migration-strategy.md)
- [Incident management](incident-management.md)
- [Entorno de desarrollo](../07-development/development-environment.md)

## Brechas

- **El rollback nunca se ha probado**: el procedimiento está escrito a partir de lo que la
  herramienta permite, no de una ejecución real.
- **`down()` no verificado**: todas las migraciones declaran `down()`, pero no se ha ejecutado un
  `migration:rollback` ni se ha comprobado que el resultado sea el esperado.
- **Sin tags ni releases**: no hay forma de saber qué commit estaba desplegado.
- **Sin entorno de staging**: un rollback es la única validación disponible.
- **Los datos de producción no son reversibles**: correos enviados y cookies emitidas no se
  deshacen.
- **Sin aviso a usuarios**: si el rollback corta el acceso, no hay a quién comunicar.
