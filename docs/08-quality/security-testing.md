# Security Testing

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Alcance

Auth · autorización · validación de entradas · SQL injection · secretos · configuración · CORS ·
CSRF · cabeceras · dependencias · exposición de datos.

## Evidencias

Verificaciones ejecutadas a mano sobre DEV (por HTTP y por inspección de la configuración). No hay
escáner, no hay informe firmado, no hay repetibilidad.

| Verificación | Método | Resultado |
|---|---|---|
| Token de un solo uso | Consumir el enlace dos veces | Correcto: el segundo uso se rechaza |
| Expiración del enlace | `expires_at` a 30 min, manipulating el registro | Correcto: se rechaza |
| Token no almacenado en claro | Lectura de `magic_links.token_hash` | Correcto: SHA-256 de 64 hex |
| Correo no registrado | `POST /login/magic` con email inexistente | Correcto: no envía correo ni crea fila |
| Hash de contraseña en signup | Lectura de `users.password` | Correcto: hash del mixin, no en claro |
| CSRF en logout | `POST /logout` con y sin XSRF | Correcto: sin XSRF la sesión sobrevive |
| Rutas protegidas | Petición sin sesión a las 9 rutas del panel | Correcto: 302 a `/`, controller no se ejecuta |
| Verbos HTTP no registrados | POST/PUT/DELETE/PATCH sobre rutas `router.on()` | Correcto: 404 |
| Inyección SQL en el buscador | Términos con `%` y `_` | Correcto: `escapeLike()` los escapa |
| Búsqueda parametrizada | Inspección del SQL generado | Correcto: `ilike` con binding |
| CORS en DEV | OPTIONS con origen arbitrario | **Inseguro por diseño**: refleja cualquier origen con `credentials` |
| CORS en PROD | OPTIONS con origen arbitrario | Correcto: allowlist vacía |
| Cabeceras | Inspección de respuesta | Parcial: HSTS, DENY y nosniff presentes; **sin CSP** |
| Sesión en cookie | Inspección de `Set-Cookie` | Correcto: cifrada y firmada con `APP_KEY` |
| Secretos fuera del repo | `git log --all -- .env` | Correcto: 0 commits |
| CORS/`.env` en el historial | `git status --ignored` | Correcto: ignorados |

## Hallazgos

Idénticos a los priorizados en
[security-requirements.md](../06-security/security-requirements.md). Resumen:

| ID | Severidad | Hallazgo | Estado | Mitigación |
|---|---|---|---|---|
| SEC-002 | Alta | **Autoregistro abierto**: `POST /signup` concede el mismo estado que un acceso concedido | Abierto | Deshabilitar la ruta o exigir invitación |
| SEC-007 | Alta | **Sin rate limiting**: fuerza bruta de magic link y spam de correo | Abierto | Rate limit por IP y por email en `MagicLinkController` |
| SEC-010 | Alta | **Sin CSP**: no hay defensa ante XSS si uno se introduce | Abierto | Habilitar `csp` en `config/shield.ts` |
| SEC-003 | Media | **Toda sesión equivale a administrador**: `users.rol` y `users.superadmin` son datos que no se leen | Abierto | Matriz de roles y guard en el middleware; decidir qué pasa con esas dos columnas |
| SEC-006 | Media | **Enumeración de correos**: la respuesta es idéntica, pero el timing y el correo recibido delatan el registro | Abierto | Respuesta con retardo constante |
| SEC-001 | Media | **CORS reflejo en DEV con `credentials`** | Aceptado | Documentado como riesgo exclusivo de DEV; nunca desplegar con `NODE_ENV=development` |
| SEC-004 | Media | **Sesión en cookie sin rotación de ID** y con vigencia de 2 h | Abierto | Rotar el ID en el login y reducir la vigencia |
| SEC-009 | Baja | **`magic_links` sin purga**: los tokens usados y expirados se acumulan | Abierto | Job de limpieza |
| SEC-011 | Baja | **El token viaja en la URL**: queda en el historial del navegador y en logs del servidor web | Aceptado | Mitigado por ser de un solo uso; alternativamente, página intermedia que hace POST |
| SEC-013 | Baja | **Sin CSP ni cabeceras de permisos**: no `Referrer-Policy` ni `Permissions-Policy` | Abierto | Añadir al config de Shield |
| SEC-030 | Media | **Sin auditoría de accesos** | Abierto | Tabla de auditoría + listener de los eventos de sesión |

## Referencias
- [Requisitos de seguridad](../06-security/security-requirements.md)
- [Autenticación](../06-security/authentication.md)
- [Autorización](../06-security/authorization.md)
- [Política de auditoría](../06-security/audit-policy.md)
- [Casos de prueba](test-cases.md)
- `config/shield.ts`, `config/cors.ts`, `app/controllers/magic_link_controller.ts`,
  `app/controllers/usuarios_controller.ts`

## Brechas

- **Sin escáner de dependencias**: no se ha ejecutado `npm audit` ni una herramienta de SCA sobre
  el árbol de dependencias.
- **Sin SAST ni DAST**: no hay análisis estático de seguridad más allá del ESLint estándar.
- **Sin pentest**: nadie externo ha evaluado la aplicación.
- **Las verificaciones son manuales y no repetibles**: no hay forma de volver a ejecutarlas ni
  evidencia archivada.
- **No se prueban los flujos de ataque que importan**: CSRF en rutas distintas de logout, XSS
  reflejado en los parámetros del buscador, inyección en otros puntos de entrada, ni agotamiento de
  recursos con enlaces grandes.
- **No hay CSP que probar**: no se puede comprobar si la política sería efectiva porque no existe.
