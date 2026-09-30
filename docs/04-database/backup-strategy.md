# Estrategia de backup

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Matriz por ambiente

Solo existe un ambiente: DEV. No hay PROD, ni staging, ni QA.

| Ambiente | Frecuencia | Retención | Cifrado | Restauración probada | RPO | RTO |
|---|---|---|---|---|---|---|
| DEV | **Ninguna** | — | No | No | **Ilimitado** (pérdida total) | No definido |
| PROD | No existe | — | — | — | — | — |

## Brecha principal

No hay ningún respaldo automático. `tmp/db.sqlite3` (cuentas y magic links) está en el disco de la
máquina de desarrollo y gitignored: si se borra, **todas las cuentas se pierden**. La recuperación
práctica es volver a ejecutar el seeder, lo que crea un único usuario de pruebas, no los reales.

| Dato | Respaldo actual |
|---|---|
| `tmp/db.sqlite3` (auth) | Ninguno |
| Catálogo en Supabase | Responsabilidad del proveedor del proyecto |
| `.env` y `APP_KEY` | Ninguno (y sin él no hay recuperación de sesiones) |
| Migraciones y esquema | Sí: versionados en Git |

## Procedimiento mínimo propuesto

No implementado; es el mínimo aceptable antes de que exista un ambiente compartido.

```bash
# Copia consistente de SQLite en caliente
sqlite3 tmp/db.sqlite3 ".backup 'backups/db-$(date +%F-%H%M).sqlite3'"
```

- Frecuencia: diaria, más una copia antes de cada migración.
- Retención: 7 diarios, 4 semanales.
- Cifrado: el volumen que contenga `APP_KEY` debe cifrarse en reposo.
- Restauración: probar trimestralmente; una copia no restaurada no es un respaldo.
- Añadir `backups/` a `.gitignore` antes de generar la primera copia.

## RTO / RPO

No definidos. Requieren una decisión explícita del responsable del negocio: cuánto tiempo puede el
panel estar caído y cuántos datos se pueden perder. Con el esquema actual (sesión en cookie, sin
duración de la sesión en base de datos) el impacto de perder la BD de auth es la pérdida de acceso,
no la pérdida de datos de negocio: el catálogo vive en Supabase.

## Referencias
- [Respaldo y recuperación](backup-recovery.md)
- [Diseño de base de datos](database-design.md)
- [Entornos](../09-infrastructure/environments.md)

## Brechas
- [Ver las brechas detalladas en backup-recovery.md](backup-recovery.md#brechas)
