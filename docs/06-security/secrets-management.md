# Gestión de secretos

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Inventario

| Secreto | Variable | Dónde se usa | Si se pierde |
|---|---|---|---|
| Clave de cifrado de la aplicación | `APP_KEY` | `config/encryption.ts:16` (AES-256-GCM) | **Inválida todas las sesiones**; los datos cifrados en cookie quedan ilegibles |
| Cadena de conexión de Supabase | `SUPABASE_DB_URL` (incluye contraseña) | `config/database.ts` | `/insumos` deja de funcionar. Requisito: debe incluir `:PASSWORD` |
| Credenciales SMTP | `SMTP_USERNAME`, `SMTP_PASSWORD` | `config/mail.ts` | No se pueden enviar enlaces; el login se vuelve inutilizable |
| Remitente del correo | `MAIL_FROM` | `config/mail.ts` | Cosmético |
| Cookie de sesión | `APP_KEY` la firma | `config/session.ts` | Igual que `APP_KEY` |

## Estado actual

| Práctica | ¿Se cumple? |
|---|---|
| Los secretos están fuera del repositorio | **Sí**: `.env` está en `.gitignore` |
| Existe una plantilla sin valores reales | **Sí**: `.env.example` |
| `start/env.ts` valida las variables al arrancar | **Sí**: falla pronto si falta algo |
| Los secretos no se loguean | **Parcial**: no se loguean contraseñas ni la BD, pero en DEV se loguea la URL del magic link, que contiene el token en claro |
| Rotación documentada | **No** |
| Almacenamiento en gestor de secretos | **No**: `.env` en el disco local |
| Cifrado en reposo del archivo `.env` | **No** |

## Procedimiento recomendado (no implementado)

1. **Nunca** escribir el valor real en un documento, commit o chat.
2. Generar `APP_KEY` con `node ace generate:key` y guardarlo en el gestor de secretos del
   ambiente.
3. Rotación de `APP_KEY`: generarla y reiniciar. Efecto colateral aceptable hoy (cierra todas las
   sesiones); se vuelve crítico cuando exista estado persistente en sesión.
4. Rotación de la contraseña de Supabase: pedirla al proveedor, actualizar el secreto y reiniciar
   (la app no cachea la cadena más allá del pool).
5. Rotación de SMTP: actualizar en el proveedor y en el secreto.
6. `SUPABASE_DB_URL` **siempre** con contraseña incluida:
   `postgresql://postgres.<ref>:<PASSWORD>@<host>:5432/postgres`.
   Sin `:PASSWORD` el arranque falla con
   `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`.

## Referencias
- [Respaldo y recuperación](../04-database/backup-recovery.md)
- [Entornos](../09-infrastructure/environments.md)
- `config/encryption.ts`, `config/database.ts`, `config/mail.ts`, `start/env.ts`, `.env.example`

## Brechas

- **`.env` en texto plano en el disco** y sin control de acceso ni cifrado.
- **Sin inventario fuera del `.env`**: si alguien pierde el archivo, no hay registro de qué secretos
  existían ni de dónde obtenerlos.
- **Historial limpio**: verificado con `git log --all -- .env` → 0 commits. `.env` nunca se
  versionó. Debe volver a comprobarse si se migra el repositorio.
- **Sin rotación periódica**: `SUPABASE_DB_URL` y SMTP son credenciales de larga vida.
- **Un único `APP_KEY` para cifrado y para sesiones**: no hay separación de dominios de clave, así
  que una filtración de un uso compromete el otro.
