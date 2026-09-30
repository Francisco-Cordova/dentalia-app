# Política de auditoría

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Conclusión

**No existe auditoría de seguridad.** No hay tabla de auditoría, ni bitácora de accesos, ni registro
de cambios de configuración. Solo hay logs del servidor.

## Qué se registra hoy

| Evento | ¿Se registra? | Dónde |
|---|---|---|
| Petición HTTP recibida | Sí, con `request_id` y status | Log del servidor (`pino-pretty`) |
| Arranque del servidor | Sí | Consola |
| Envío de correo fallido | Sí, con el error | `logger.error(...)` en `magic_link_controller.ts:36` |
| Enlace generado (DEV) | **Sí, con el token en claro** | `logger.info('[MAGIC LINK DEV] <url>')` |
| Inicio de sesión correcto | No | — |
| Inicio de sesión fallido | No | — |
| Intento con token inválido o expirado | No | — |
| Cierre de sesión | No | — |
| Acceso a `/insumos` | No (solo el status 200 en el log de petición) | — |
| Alta de usuario (`POST /signup`) | No | — |
| Cambio de configuración o despliegue | No | — |

## Política propuesta (no implementada)

### Eventos que deberían registrarse

| Categoría | Eventos |
|---|---|
| Autenticación | Login correcto e incorrecto, consumo de enlace, expiración, logout, alta de cuenta |
| Autorización | Acceso denegado, intento de uso de una ruta protegida sin sesión |
| Datos | Lecturas del catálogo, exportaciones, cualquier escritura |
| Sistema | Despliegue, cambio de `.env`, rotación de `APP_KEY`, fallo de SMTP o de base de datos |

### Campos mínimos
`actor` → `acción` → `recurso` → `fecha/hora` → `resultado` → `correlation ID`.

El `request_id` que AdonisJS ya genera (`config/app.ts:20`) sirve como correlation ID, pero habría
que devolverlo en la respuesta y propagarlo a Supabase y al SMTP.

### Retención
Por definir. Puntos a decidir: volumen (si se registra cada lectura del catálogo, el crecimiento es
rápido), y si los logs incluyen datos personales (correos), lo que activa obligaciones de
retención y supresión.

## Referencias
- [Clasificación de datos](data-classification.md)
- [Requisitos de seguridad](security-requirements.md)
- [Calidad y observabilidad](../09-infrastructure/monitoring.md)

## Brechas

- **SEC-030 incumplido**: no hay forma de reconstruir quién accedió a qué ni cuándo.
- **No hay `request_id` expuesto al cliente**: aunque se genera, no se devuelve en la respuesta, así
  que un usuario no puede reportar un incidente con un identificador útil.
- **No hay correlación entre servicios**: el `request_id` no se propaga a Supabase ni al SMTP.
- **Los logs no tienen destino, rotación ni retención definidos**: se escriben en consola. Si alguien
  los redirige a un archivo, pueden acabar conteniendo el token de los enlaces en DEV.
- **No hay alertas**: nada vigila fallos de SMTP, rechazos de CSRF ni intentos de enumeración.
- **No hay registro de accesos al catálogo**: un escaneo sistemático de `/insumos` sería
  indistinguible del uso legítimo.
- **Los eventos de sesión de `@adonisjs/auth`** (`session_auth:login_succeeded`, etc.) están
  declarados en los tipos pero **no tienen listener**: la librería los emite y nadie los consume.
