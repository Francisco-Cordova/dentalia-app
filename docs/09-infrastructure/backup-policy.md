# Política de backup

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | `7bb5ecb` |

> Documento de política operativa. El detalle técnico de qué contiene cada base está en
> [04-database/backup-recovery.md](../04-database/backup-recovery.md); esta página cubre quién
> protege qué y con qué prioridad.

## Resumen ejecutivo

**No hay ningún respaldo automático en el proyecto.** Lo único respaldado es el código (Git). La
base de datos de auth (`tmp/db.sqlite3`), que contiene las cuentas de los usuarios, **no tiene
respaldo**. Si se pierde, todas las cuentas se pierden.

## Matriz de recursos

| Recurso | Frecuencia | Retención | Restauración | Owner |
|---|---|---|---|---|
| **Código y migraciones** | Por commit (push) | Indefinida (historial de Git) | `git checkout` de una etiqueta | Dev owner |
| **`tmp/db.sqlite3`** (`users`, `magic_links`) | **Ninguna** | — | **Imposible**: no hay copia | Dev owner *(no lo sabe)* |
| **`.env` / `APP_KEY`** | **Ninguna** | — | **Imposible**: sin la clave no hay sesiones válidas | Dev owner *(no lo sabe)* |
| **Catálogo en Supabase** | **Fuera de este proyecto** | — | Responsabilidad del proveedor | No identificado |
| **Build (`build/`, `public/assets`)** | Regenerable | N/A | `npm run build` | Automático |

## Prioridad de recuperación

De más a menos costosa de perder:

| # | Recurso | Impacto de perderlo | Coste de recuperarlo |
|---|---|---|---|
| 1 | Código | Ninguno: está en Git | Cero |
| 2 | Catálogo | `/insumos` deja de funcionar | Depende del proveedor de Supabase |
| 3 | `.env` y `APP_KEY` | Se pierden correos y la credencial de BD | Hay que pedirlo todo de nuevo |
| 4 | `users` | **Nadie puede entrar al panel** | Hay que dar de alta a cada persona otra vez |
| 5 | `magic_links` | Irrelevante: los tokens caducan a los 30 min | Se puede regenerar pidiéndolos otra vez |

## Procedimiento mínimo (no implementado)

### Frecuencia

| Recurso | Frecuencia propuesta | Motivo |
|---|---|---|
| `tmp/db.sqlite3` | Diaria, más una copia antes de cada migración | Las cuentas cambian poco; una migración puede romperla |
| `.env` y `APP_KEY` | En cada cambio, en un gestor de secretos | No se puede regenerar: hay que pedirlo |
| Catálogo | Ninguna: no es responsabilidad de este proyecto | Solo lectura |

### Retención

7 diarios, 4 semanales, 12 mensuales. Volumen esperado: pocos megabytes.

### Verificación

Una copia que no se ha restaurado **no es un respaldo**. Probar la restauración trimestralmente es
requisito, no opcional.

### Comando

```bash
# Copia consistente de SQLite en caliente (no copiar el archivo mientras se escribe).
# Sustituir <fecha> por una marca temporal, p. ej. 2026-09-30-1830.
sqlite3 tmp/db.sqlite3 ".backup 'backups/db-<fecha>.sqlite3'"
```

> `backups/` debe añadirse a `.gitignore` **antes** de generar la primera copia. Hoy no está, y
> un archivo `.sqlite3` versionado en Git es una fuga de datos.

### Cifrado

El respaldo contiene correos de usuarios y hashes de contraseña: es dato confidencial. El volumen
que lo contenga debe cifrarse en reposo, y el de `.env` con más razón.

## Referencias
- [Respaldo y recuperación (detalle técnico)](../04-database/backup-recovery.md)
- [Estrategia de backup (matriz por ambiente)](../04-database/backup-strategy.md)
- [Disaster recovery](disaster-recovery.md)
- [Clasificación de datos](../06-security/data-classification.md)
- [Gestión de secretos](../06-security/secrets-management.md)

## Brechas

- **No hay respaldo de la base de datos de auth**: es la brecha más grave de este documento. Perder
  `tmp/db.sqlite3` deja el sistema inaccesible para todos.
- **No hay respaldo de los secretos**: si se pierde `APP_KEY` o el `.env`, hay que reconstruir el
  acceso a Supabase y al correo desde cero.
- **`backups/` no está en `.gitignore`**: el primer `sqlite3 .backup` Manual dejaría datos
  personales versionados en Git.
- **No hay owner reconocido**: la columna Owner dice "Dev owner", pero nadie ha asumido la tarea.
- **No hay verificación de restauración**: no hay ninguna copia, luego no hay nada que probar; pero
  tampoco existe el procedimiento probado que se ejecutaría cuando haya copias.
- **Sin retención declarada para los datos que sí importan**: `users` y `magic_links` no tienen
  política de purga (SEC-009), así que crecerán sin límite.
