# Gestión de incidentes

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | `7bb5ecb` |

## Conclusión

**No hay gestión de incidentes.** No hay severidades definidas, ni responsables, ni canales, ni
plantillas de comunicación, ni registro histórico. Solo hay una persona. Lo que sigue define un
marco mínimo propuesto, no un proceso vigente.

## Severidades

Los criterios se derivan del impacto real del sistema: sin login, nadie puede usarlo; sin catálogo,
el login sigue sirviendo.

| Nivel | Definición | Ejemplo real | Respuesta |
|---|---|---|---|
| **SEV-1** | **Nadie puede entrar.** El producto no sirve | `tmp/db.sqlite3` borrado; `APP_KEY` perdida; el servidor no arranca; SMTP caído | Inmediato, sin horario |
| **SEV-2** | **Entran pero el catálogo no carga.** Producto degradado | Supabase caído; `searchPath` mal; `SUPABASE_DB_URL` incorrecta | Mismo día |
| **SEV-3** | **Fallo parcial sin impacto en el acceso** | Un enlace concreto falla; un filtro devuelve vacío; CSS roto en una sección | Sin plazo |
| **SEV-4** | Sin impacto en el usuario | Un `console.log` en el log; una petición 404 esperada | Backlog |

Nota sobre el criterio de SEV-1: `SESSION_DRIVER=cookie` significa que **el estado de sesión vive
en el cliente**. Perder `APP_KEY` no solo cierra sesiones, invalida cualquier copia de cookie
emitida. Y perder `tmp/db.sqlite3` elimina las cuentas de forma irreversible.

## Flujo

```
Detectar → Contener → Recuperar → Comunicar → RCA → Acciones
```

| Etapa | Qué significa aquí | Estado |
|---|---|---|
| **Detectar** | Notarse por un usuario. **No hay monitoreo, alertas ni health check** | El tiempo de detección es el tiempo que tarda alguien en quejarse |
| **Contener** | Evitar que empeore. Con un solo proceso local, casi siempre es "parar y pensar" | No hay procedimiento |
| **Recuperar** | Reiniciar el proceso, restaurar una copia, corregir `.env` | Ver [runbook.md](runbook.md) |
| **Comunicar** | Avisar a los usuarios afectados | **No hay lista de usuarios ni canal de aviso** |
| **RCA** | Entender por qué pasó | No hay histórico |
| **Acciones** | Evitar la repetición | No hay registro de acciones |

## Riesgos conocidos sin incidente asociado

| Riesgo | Probabilidad | Impacto | Previo |
|---|---|---|---|
| Pérdida de `tmp/db.sqlite3` | Media (está en `tmp/`, gitignored) | SEV-1, **irrecuperable** | Ninguno |
| Rotación inadvertida de `APP_KEY` | Media (cualquier `generate:key`) | SEV-1 para todos | Ninguno |
| `SUPABASE_DB_URL` sin contraseña tras un clonado | Alta | SEV-2 | Documentado en [troubleshooting](troubleshooting.md) |
| Caída prolongada de Supabase | Media | SEV-2 | `withConnectionRetry()` cubre **un** corte |
| SMTP caído | Media | SEV-1 (nadie entra) | Log del token, solo en DEV |
| `.as()` perdido en `start/routes.ts` | Media | Enlaces rotos, silenciosos | Checklist de codegen |
| Token de un enlace robado antes de ser usado | Baja | Acceso no autorizado hasta consumirlo | Uso único y expiración de 30 min |
| Enumeración de correos | Media | Se descubre qué correos están registrados | Rate limiting inexistente |
| Dependencia externa sin contacto | Alta | No hay a quién escalar | Ninguno |

## Lo que hace falta para gestionar incidentes de verdad

| Pieza | Propósito | Estado |
|---|---|---|
| Health check | Detectar caída sin un usuario | No existe |
| Alertas | Avisar al detectar | No existe |
| Contactos de proveedores | Escalar a Supabase y Mailtrap | No registrados |
| Lista de usuarios | Comunicar una caída | No existe (y no habría dónde guardarla sin un módulo de usuarios) |
| Canal de comunicación | Avisar | No definido |
| Turnos o guardias | Responder fuera de horario | No aplica: una sola persona |
| Registro de incidentes | Aprender de los errores | No existe |
| Postmortem | Analizar causa raíz | No existe |

## Referencias
- [Runbook](runbook.md)
- [Troubleshooting](troubleshooting.md)
- [Monitoreo](../09-infrastructure/monitoring.md)
- [Política de auditoría](../06-security/audit-policy.md)
- [Security testing](../08-quality/security-testing.md)
- [Disaster recovery](../09-infrastructure/disaster-recovery.md)

## Brechas

- **Sin detección**: no hay forma de saber que el sistema está caído. El incidente solo existe
  cuando alguien lo reporta.
- **Sin responsables más allá de una persona**: no hay a quién escalar dentro del equipo, ni fuera.
- **Sin comunicación**: sin lista de usuarios ni canal, un SEV-1 no se puede avisar a quien
  debería enterarse.
- **Sin registro histórico**: no se sabe qué ha fallado antes ni con qué frecuencia.
- **La pérdida de la base de auth es irrecuperable**: es el incidente más grave posible y el que
  menos preparación tiene.
- **Sin proceso de postmortem**: las correcciones dependen de que alguien recuerde el incidente.
