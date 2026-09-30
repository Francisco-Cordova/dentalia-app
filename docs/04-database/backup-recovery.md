# Respaldo y recuperación

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Qué hay que respaldar

| Dato | Ubicación | Criticidad | ¿Está en el repo? |
|---|---|---|---|
| Cuentas y magic links | `tmp/db.sqlite3` | **Alta** (credenciales) | No, gitignored |
| Catálogo de insumos | Supabase `dev."Insumos"` | Alta | No, externo |
| Esquema de auth | `database/migrations/` | Alta | **Sí** |
| Configuración | `.env` (plantilla en `.env.example`) | **Crítica** (secretos) | Solo la plantilla |
| `APP_KEY` | `.env` | **Crítica** | No |
| Esquema generado | `database/schema.ts` | Media | Sí |

## Estado actual: no hay respaldos

No existe ningún procedimiento, script, cron ni servicio de respaldo en el repositorio. Los
riesgos concretos:

| Riesgo | Consecuencia | Mitigación disponible hoy |
|---|---|---|
| Se borra o corrompe `tmp/db.sqlite3` | Se pierden todas las cuentas y el acceso al panel (no hay recuperación por correo: el magic link exige usuario previo) | Copiar el archivo. El seeder recrea un usuario de pruebas |
| Se pierde `APP_KEY` | **Todas** las sesiones quedan inválidas y los datos cifrados (sesiones en cookie) son irrecuperables | Guardar la clave fuera del repo, en un gestor de secretos |
| Se pierde `SUPABASE_DB_URL` | `/insumos` deja de funcionar; no hay copia local | Pedir una nueva al proveedor |
| Se pierde `.env` | El arranque falla por validación de env (`start/env.ts`) | Reconstruir desde `.env.example` + secretos |

## Procedimiento propuesto (no implementado)

### Diario / por evento
```bash
# Copia consistente de SQLite (en caliente, sin bloquear escrituras)
sqlite3 tmp/db.sqlite3 ".backup 'backups/db-$(date +%F-%H%M).sqlite3'"
```

Considerar `VACUUM INTO` como alternativa si `sqlite3` no está disponible.

### Catálogo
No requiere respaldo desde aquí: la responsabilidad es del equipo que administra Supabase. La
aplicación solo lee. Conviene pedir por escrito su política de PITR.

### Antes de migraciones en ambientes con datos
```bash
cp tmp/db.sqlite3 backups/db-pre-migration.sqlite3
```

### Restauración
```bash
cp backups/db-AAAA-MM-DD-HHMM.sqlite3 tmp/db.sqlite3
node ace migration:status
```
Restaurar `db.sqlite3` no requiere migración: el esquema viaja en el archivo.

## Puntos de atención

- **La sesión no está en la base de datos**: al restaurar la BD, las sesiones ya emitidas siguen
  siendo válidas (viven en la cookie del cliente) salvo que también haya cambiado `APP_KEY`.
- **`tmp/` es descartable por diseño**: cualquier herramienta que "limpie" `tmp/` borra la base de
  datos de auth. No es un directorio de caché, es el almacén de credenciales.
- Los magic links son de un solo uso y expiran en 30 min: no hay nada que respaldar de ellos, pero
  tampoco hay auditoría de consumo más allá de `used_at`.
- No hay cifrado en reposo sobre `tmp/db.sqlite3`: los hashes de contraseña son scrypt, pero el
  archivo es texto legible para quien tenga acceso al disco.

## Brechas

- **Sin respaldos automáticos**: la pérdida de `tmp/db.sqlite3` es irrecuperable en la práctica.
- **Sin `.gitignore` explícito de `backups/`**: hay que crearlo antes de generar copias.
- **Sin PITR ni réplicas** del lado Supabase desde este proyecto.
- **Sin plan de recuperación probado**: ningún RTO/RPO está definido.
- **Secretos sin rotación documentada**: ver [secrets-management](../06-security/secrets-management.md).

## Referencias
- [Diseño de base de datos](database-design.md)
- [Entornos](../09-infrastructure/environments.md)
