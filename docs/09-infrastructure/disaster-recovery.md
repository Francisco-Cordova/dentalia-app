# Disaster Recovery

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | `7bb5ecb` |

## Conclusión

**No hay plan de recuperación ante desastres.** No hay RPO ni RTO definidos, ni copies, ni
procedimiento probado, ni responsables. Lo que sigue es un análisis de qué se perdería y qué
haría falta, no un plan vigente.

## RPO

**Sin definir.** Nadie ha declarado cuántos datos se pueden perder.

Si se adopta la propuesta (RPO 24 h para la base de auth, 0 para el código):

| Recurso | RPO propuesto | Justificación |
|---|---|---|
| Código | **0** | Todo está en commits; no hay build válido en Git |
| `tmp/db.sqlite3` | 24 h | Las cuentas cambian poco; el coste de una copia frecuente es bajo |
| `.env` / `APP_KEY` | **0**, en gestor de secretos | No se pueden regenerar |
| Catálogo | Fuera de alcance | Responsabilidad de Supabase |

Con RPO 24 h sobre auth: **se pueden perder hasta 24 h de altas de cuentas**. Un usuario dado de
alta ayer podría no existir hoy.

## RTO

**Sin definir.** Nadie ha declarado cuánto tiempo puede estar caído el panel.

Propuesta, según el impacto:

| Escenario | RTO propuesto | Depende de |
|---|---|---|
| Proceso caído, reiniciar | Minutos | Que alguien lo note y lo reinicie |
| Disco perdido, hay copia de `tmp/db.sqlite3` | Horas | Que la copia exista y se sepa dónde |
| Disco perdido, **no hay copia** | **Ilimitado**: hay que dar de alta a cada persona de nuevo | — |
| `APP_KEY` perdida | Inmediato si hay copia del secreto; si no, pedir de nuevo | Desarrollo |
| Supabase caído | El panel arranca, pero `/insumos` falla | El proveedor |

El RTO del caso "no hay copia" es el dato más incómodo del proyecto: **no hay recuperación posible
para las cuentas**.

## Escenarios

### Pérdida de la base de datos de auth

| Aspecto | Detalle |
|---|---|
| Causa | Borrado de `tmp/db.sqlite3` (está en `tmp/`, gitignored), fallo de disco, `migration:rollback` mal aplicado |
| Señal | Todos los usuarios pierden el acceso; los magic links pendientes fallan |
| Impacto | **Total**: nadie entra. El catálogo no se ve afectado |
| Recuperación actual | **Imposible**. Sin copia, no hay nada que restaurar |
| Recuperación propuesta | Restaurar la copia y reejecutar `node ace migration:run`; los enlaces ya emitidos dejan de servir |
| Comunicación | Avisar a los usuarios de que deben pedir un enlace nuevo |

### Caída del servicio

| Aspecto | Detalle |
|---|---|
| Causa | Caída del proceso Node, de la máquina, o de la red |
| Señal | No hay monitoreo: **nadie se entera** salvo que alguien intente usarlo |
| Impacto | Caída total |
| Recuperación | Reiniciar el proceso. No hay alta disponibilidad ni réplicas |
| Datos | Ninguno se pierde: SQLite está en el proceso de la request, no en memoria |

### Caída de Supabase

| Aspecto | Detalle |
|---|---|
| Causa | El proveedor corta conexiones inactivas o cae |
| Señal | `withConnectionRetry()` cubre **un** corte. Si persiste, `/insumos` muestra el error |
| Impacto | Solo el catálogo. El login sigue funcionando (SQLite es local) |
| Recuperación | Esperar al proveedor. El login no se ve afectado |
| Riesgo residual | Un error de conexión **no** se distingue de una BD caída en los logs: no hay alerta |

### Pérdida de los secretos

| Aspecto | Detalle |
|---|---|
| Causa | Borrado del `.env`, rotación inadvertida, equipo nuevo |
| Señal | El servidor falla al arrancar: `start/env.ts` valida las variables |
| Impacto | Total si no hay copia: ni correo, ni Supabase, ni sesiones válidas |
| Recuperación | Regenerar `APP_KEY` invalida todas las sesiones (aceptable: no hay datos en sesión) y pedir la credencial de Supabase al proveedor |

### Pérdida del código

| Aspecto | Detalle |
|---|---|
| Causa | Push forzado, repositorio corrupto |
| Impacto | Irrecuperable |
| Mitigación | Está en Git. Es el único recurso realmente protegido |

## Prueba del plan

**No hay plan, luego no hay prueba.** Lo que debería hacerse y no se hace:

| Prueba | Frecuencia propuesta | Evidencia |
|---|---|---|
| Restaurar `tmp/db.sqlite3` desde una copia en limpio | Trimestral | Registro de la restauración |
| Arrancar con `NODE_ENV=production` y verificar los 9 puntos de [deployment.md](deployment.md) | Antes de cada despliegue | Checklist firmado |
| Reconstruir el entorno desde cero siguiendo [environments.md](environments.md) | Semestral | Tiempo real medido |
| Simular la pérdida de `APP_KEY` | Semestral | Tiempo real de recuperación |

## Referencias
- [Política de backup](backup-policy.md)
- [Respaldo y recuperación](../04-database/backup-recovery.md)
- [Deployment](deployment.md)
- [Gestión de incidentes](../10-operations/incident-management.md)
- [Runbook](../10-operations/runbook.md)

## Brechas

- **RPO y RTO sin definir**: sin esos dos números no hay objetivo de recuperación, ni se puede
  evaluar si una inversión en infraestructura está justificada.
- **Ninguna copia existe**: la mayor parte de este documento es aspiracional.
- **La pérdida de la base de auth es irrecuperable**: es el escenario más probable (está en `tmp/`)
- **La pérdida de la base de auth es irrecuperable**: es el escenario más probable (está en `tmp/`)   y el que menos se ha trabajado.
- **Nadie se entera de una caída**: no hay monitoreo ni alertas, así que el tiempo de detección es
  el tiempo que tarda alguien en intentar usar el panel.
- **Sin responsables ni comunicación**: no hay a quién escalar ni a quién avisar.
- **El plan nunca se ha probado**: no hay ninguna evidencia de que el procedimiento propuesto
  funcione.
