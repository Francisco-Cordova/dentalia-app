# Requerimientos no funcionales

## Control del documento

| Campo | Valor |
|---|---|
| Estado | DRAFT |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2278659, 5b4f99b |

Solo se documentan los requisitos que el código **ya cumple o ya expone**. Los que no existen se
listan como `PENDIENTE` con el motivo, no se inventan métricas.

| ID | Área | Requerimiento | Métrica / Criterio | Prioridad | Evidencia |
|---|---|---|---|---|---|
| RNF-SEC-001 | Seguridad | El token de acceso nunca se persiste en claro | `magic_links.token_hash` = sha256 (64 hex) | Alta | `magic_link_controller.ts:26`, AC-AUT-002 |
| RNF-SEC-002 | Seguridad | El enlace de acceso tiene vigencia limitada | 30 minutos | Alta | `magic_link_controller.ts:13`, AC-AUT-003 |
| RNF-SEC-003 | Seguridad | Cada enlace abre como máximo una sesión | `used_at IS NULL` + escritura previa al login | Alta | `magic_link_controller.ts:55,64`, AC-AUT-004 |
| RNF-SEC-004 | Seguridad | La cookie de sesión no es accesible desde JavaScript | `HttpOnly` | Alta | `config/session.ts:41` |
| RNF-SEC-005 | Seguridad | La cookie de sesión no se envía en peticiones de terceros | `SameSite=Lax` | Alta | `config/session.ts:51` |
| RNF-SEC-006 | Seguridad | Los datos de sesión traveling en cookie van cifrados | AES-256-GCM (`encryption.default: 'gcm'`) | Alta | `config/encryption.ts:8` |
| RNF-SEC-007 | Seguridad | Las operaciones de escritura exigen token CSRF | Sin token válido la operación se rechaza y la sesión sobrevive | Alta | `config/shield.ts:33,49`, AC-AUT-007 |
| RNF-SEC-008 | Seguridad | El panel no se puede incrustar en otro sitio | `X-Frame-Options: DENY` | Media | `config/shield.ts:60,65` |
| RNF-SEC-009 | Seguridad | Se fuerza HTTPS en producción | HSTS `max-age=180 days` | Media | `config/shield.ts:75,80` |
| RNF-SEC-010 | Seguridad | Se evita el content sniffing | `X-Content-Type-Options: nosniff` | Media | `config/shield.ts:91` |
| RNF-SEC-011 | Seguridad | Las contraseñas nunca se serializan al cliente | `serializeAs: null` + `pick` en el transformer | Alta | `database/schema.ts:48`, `app/transformers/user_transformer.ts:6-13` |
| RNF-SEC-012 | Seguridad | Los secretos no están en el repositorio | `.env` en `.gitignore`; `.env.example` es placeholder | Alta | `.gitignore:8` |
| RNF-PERF-001 | Rendimiento | El listado no puede quedar colgado esperando una conexión | `acquireTimeoutMillis` y `createTimeoutMillis` = 10 000 ms | Alta | `config/database.ts:84-85` |
| RNF-PERF-002 | Rendimiento | El pool de catálogo es acotado | `max: 5`, `min: 0` conexiones | Media | `config/database.ts:82-83` |
| RNF-PERF-003 | Rendimiento | Las conexiones ociosas se reciclan antes de que el servidor las corte | `idleTimeoutMillis` = 30 000 ms | Alta | `config/database.ts:84`, BR-INS-006 |
| RNF-PERF-004 | Rendimiento | Los sockets muertos se detectan pronto | `keepAliveInitialDelayMillis` = 30 000 ms | Alta | `config/database.ts:14` |
| RNF-PERF-005 | Rendimiento | La sesión expira | 2 horas (`Max-Age=7200` observado) | Media | `config/session.ts:26` |
| RNF-DIS-001 | Disponibilidad | Una caída de conexión del catálogo degrada a reintento, no a caída de pantalla | 1 reintento ante error de conexión | Alta | `app/services/with_connection_retry.ts`, AC-INS-007 |
| RNF-DAT-001 | Datos | El catálogo se resuelve en el schema `dev` | `current_schema() = dev` | Alta | `config/database.ts:96`, AC-INS-008 |
| RNF-DAT-002 | Datos | La aplicación no escribe en el catálogo | 0 rutas de escritura; `migrations.paths: []` | Alta | BR-INS-003, AC-INS-009 |
| RNF-COM-001 | Compatibilidad | La sesión sobrevive al cierre del navegador | `clearWithBrowser: false` (expiración por tiempo) | Baja | `config/session.ts:20` |
| RNF-OBS-001 | Observabilidad | Cada petición tiene un identificador correlacionable | `generateRequestId: true` | Media | `config/app.ts:20` |
| RNF-PRIV-001 | Privacidad | El correo del usuario solo se expone a su propia sesión | `user` se comparte por Inertia solo si hay sesión | Media | `app/middleware/inertia_middleware.ts:24` |
| RNF-ESC-001 | Escalabilidad | El volumen de catálogo se maneja sin paginar en memoria | Paginación de 10 en SQL (`LIMIT/OFFSET`), no en el cliente | Media | `insumos_controller.ts:27` |
| RNF-MNT-001 | Mantenimiento | El código pasa las verificaciones automáticas | `npm run lint` y `npm run typecheck` sin errores | Alta | CI local (gates) |
| RNF-ACE-001 | Accesibilidad | Los iconos no se anuncian al lector de pantalla | `aria-hidden="true"` por defecto | Baja | `inertia/components/icon.tsx:130` |

## Áreas revisadas y sin requisito vigente

Seguridad (cifrado, RBAC, rate limiting) · rendimiento (p95, throughput) · disponibilidad ·
escalabilidad (más allá del catálogo) · auditoría · logs estructurados · backups · archivos ·
privacidad · RPO/RTO · accesibilidad · compatibilidad · observabilidad (métricas, trazas, alertas).

Todas están **pendientes**: el proyecto no tiene ambientes TEST/UAT/PROD, ni CI, ni APM, ni
política de respaldo del catálogo SQLite. Ver `docs/09-infrastructure/` y `docs/06-security/`.

## Brechas

- No hay medición de p95 ni de throughput: `RNF-PERF-*` describe límites configurados, no rendimiento observado.
- No existe CSP (`config/shield.ts:12`): requisito de seguridad pendiente y relevante porque el token de acceso viaja en la URL.
- No hay rate limiting en `POST /login/magic` ni en `/signup`: permite agotar el buzón SMTP y disparar correos no deseados.
- No hay RBAC: el único control es autenticado/no autenticado.
- No hay verificación de correo: `/signup` autentica de inmediato.
- No hay política de respaldo del archivo `tmp/db.sqlite3` (auth y magic links).
- No hay métricas ni trazas: solo logs JSON a stdout con `request_id`.
