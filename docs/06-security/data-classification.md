# Clasificación de datos

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Niveles

| Nivel | Definición | Datos del proyecto |
|---|---|---|
| **Público** | Puede mostrarse a cualquiera | Logo, textos de la UI, estructura del catálogo (nombres de insumos, códigos, marcas, precios) |
| **Interno** | Solo para usuarios autenticados | Nada distinguible: todas las pantallas del panel son accesibles con sesión |
| **Confidencial** | No debe salir del perímetro | Correos de los usuarios, hashes de contraseña, tokens de acceso |
| **Secreto** | Filtrar compromete el sistema | `APP_KEY`, contraseña de `SUPABASE_DB_URL`, credenciales SMTP |

## Tratamiento por nivel

| Nivel | Almacenamiento | En tránsito | En logs | Copias |
|---|---|---|---|---|
| Público | Tablas de Supabase y assets del repo | HTTPS en producción | Sin restricción | El catálogo completo es legible por cualquiera con conexión a Supabase |
| Interno | — | — | — | — |
| Confidencial | `users.email`, `users.password` (scrypt), `magic_links.token_hash` | Solo dentro del servidor; el token viaja en el correo y en la URL | **El token en claro se loguea en DEV** (`[MAGIC LINK DEV] <url>`) | El correo del magic link queda en el buzón y en el historial del cliente de correo |
| Secreto | `.env` | HTTPS hacia Supabase y SMTP | No se loguean | `.env` en el disco, sin cifrar |

## El catálogo es público por diseño

`dev."Insumos"` se trata como **público**: nombres, códigos, marcas, cantidades y costos de
insumos de una clínica. No hay información de pacientes. La conexión a Supabase usa una credencial
de solo lectura de la aplicación, pero el proyecto **no controla** quién más accede a ese proyecto
de Supabase ni con qué permisos: eso es del equipo propietario.

Precaución: el nombre del proyecto Supabase y su URL no deben documentarse en este repositorio
por ser datos de conexión (van en `.env`).

## Datos personales

| Dato | Dónde | Retención |
|---|---|---|
| Correo electrónico | `users.email` | Indefinida: no hay proceso de baja ni purga |
| Nombre completo | `users.full_name` | Igual; además es **opcional** y solo se usa en el sidebar |
| Hash de contraseña | `users.password` | Indefinida; se conserva aunque el login sea código muerto |
| Token hasheado | `magic_links.token_hash` | Indefinida: **no hay purga** de tokens usados ni expirados |

## Referencias
- [Diccionario de datos](../04-database/data-dictionary.md)
- [Gestión de secretos](secrets-management.md)
- [Política de auditoría](audit-policy.md)

## Brechas

- **No hay política de retención**: los correos y hashes se conservan indefinidamente, y
  `magic_links` crece sin límite (ni purga ni job).
- **No hay derecho de supresión**: no existe proceso para eliminar la cuenta de un usuario, ni
  automática (la fila) ni por el titular de los datos.
- **Los tokens usados se conservan**: permiten reconstruir quién pidió un enlace y cuándo, aunque
  ya no sirvan para autenticar.
- **El token viaja en la URL**: queda registrado en el historial del navegador y en los logs del
  servidor web/CDN que haya delante. Al ser de un solo uso, el riesgo es acotado, pero no nulo.
- **No hay clasificación declarada para el catálogo**: se asume público, pero no está acordado por
  escrito con el proveedor de los datos.
