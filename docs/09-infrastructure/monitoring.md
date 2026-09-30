# Monitoreo y observabilidad

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | `7bb5ecb` |

## Conclusión

**No hay monitoreo.** No hay métricas, ni tracing, ni alertas, ni health check, ni agregador de
logs. Lo único que existe es un archivo de log en `tmp/serve.log` que nadie mira, y **dos llamadas
al logger en toda la aplicación**, ambas en el controlador del magic link.

## Inventario de telemetría real

| Señal | Estado | Detalle |
|---|---|---|
| **Logs de petición HTTP** | **Sí** | Los emite AdonisJS automáticamente: método, URL, status, duración, `request_id` |
| **Archivo de log** | **Sí** | `tmp/serve.log` (`targets.file`), gitignored |
| `LOG_LEVEL` | Configurado | `info` por defecto en `.env.example` |
| **Llamadas al logger de la app** | **2** | `magic_link_controller.ts:36` (`logger.error`) y `:38` (`logger.info`) |
| **Métricas** | **No** | Sin contadores, sin histograms, sin exposition |
| **Tracing** | **No** | Sin OpenTelemetry ni request-id propagado |
| **Alertas** | **No** | Nada vigila nada |
| **Health check** | **No** | No hay ruta `/health` ni similar |
| **Error tracking** (Sentry…) | **No** | — |
| **Uptime monitoring** | **No** | — |

Que solo haya dos llamadas al logger en toda la app es el dato más relevante: **los errores de
negocio son invisibles**. Si `/insumos` lanza una excepción, solo aparece como una línea de 500 en
el log de petición, sin contexto.

## Las dos únicas llamadas al logger

| Ubicación | Nivel | Cuándo | Contenido | Riesgo |
|---|---|---|---|---|
| `magic_link_controller.ts:36` | `error` | SMTP falló al enviar el enlace | El error del transporte | **Alto**: puede incluir credenciales SMTP en el mensaje del error |
| `magic_link_controller.ts:38` | `info` | SMTP falló **y** `inProduction` es falso | La URL completa con el token | **Crítico en DEV**: el token queda en el log en claro |

La segunda existe como ayuda para poder probar el login sin correo. Está condicionada a
`inProduction`, así que con `NODE_ENV=production` no se emite. Ese es exactamente el motivo por el
que desplegar sin `NODE_ENV=production` es peligroso.

## Señales que deberían observarse (no implementado)

| Señal | Qué observar | Umbral | Por qué |
|---|---|---|---|
| Tasa de 5xx | Peticiones con excepción | > 0 | Lo único que detecta un fallo total |
| Latencia de `/insumos` | Duración de la consulta a Supabase | Por definir | Cortes de conexión y `withConnectionRetry()` la alargan |
| Tasa de error de conexión a Supabase | Errores del helper | > 1 seguido | Indica caída del proveedor |
| Éxito de envío de correo | Fallos de SMTP | > 0 | **Sin correo no hay login**: es la dependencia crítica |
| Links solicitados vs. consumidos | Ratio | Por definir | Detecta abuso del endpoint y enlaces robados |
| Links fallidos por token inválido | Volumen | Pico puntual | Intentos de enumeración o enlaces expirados atacados |
| Estado del proceso | Vivo/muerto | — | No hay health check ni supervisor |
| Tamaño de `magic_links` | Filas acumuladas | Crece sin purga | SEC-009 |

## Lo que el `request_id` permite y lo que no

AdonisJS genera un `request_id` por petición (`generateRequestId: true` en `config/app.ts`).

| Capacidad | Estado |
|---|---|
| Está en los logs de petición | Sí |
| Se puede correlacionar una línea de log con una petición | Sí, si la petición falló |
| Se devuelve al cliente en la respuesta | **No**: sin cabecera `X-Request-Id`, un usuario no puede reportar un incidente |
| Se propaga a Supabase | No |
| Se propaga a SMTP | No |
| Se registra en los eventos de sesión de `@adonisjs/auth` | No: esos eventos **no tienen listener** |

## Referencias
- [Política de auditoría](../06-security/audit-policy.md)
- [Runbook](../10-operations/runbook.md)
- [Troubleshooting](../10-operations/troubleshooting.md)
- [Rendimiento](../08-quality/performance-testing.md)
- `config/logger.ts`, `config/app.ts`, `app/controllers/magic_link_controller.ts`, `.env.example`

## Brechas

- **No hay monitoreo**: una caída solo se detecta cuando alguien intenta usar el panel.
- **Sin health check**: no hay forma de que un orquestador o un supervisor sepa si el proceso vive.
- **Sin alertas**: los dos únicos logs de la aplicación se escriben y nadie los lee.
- **`request_id` no se expone al cliente**: sin él, el soporte no puede empezar a investigar.
- **Sin tracing**: no se puede seguir una petición desde el servidor hasta Supabase o el SMTP.
- **Sin métricas**: imposible saber si una consulta se degradó, si el catálogo creció o si la
  latencia subió.
- **Los logs no tienen destino ni retención**: viven en `tmp/`, que está gitignored, y se pierden
  con un `git clean`.
- **`tmp/serve.log` puede contener tokens en claro** en DEV por el log del magic link.
