# Checklist de revisión de código

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

Guía de auto-revisión. **No hay proceso de revisión por pares en el repositorio**, así que este
documento no equivale a una aprobación formal.

## Alcance del cambio

- [ ] ¿El cambio corresponde a una feature declarada en `docs/features/`?
- [ ] ¿La feature está en un estado que permite implementar (no `DRAFT` ni `ANALYZED`)?
- [ ] ¿El tamaño es razonable o mezcla dos cosas?

## Rutas y codegen

- [ ] Toda ruta referenciada por el cliente conserva su `.as('nombre')`
- [ ] `node ace codegen` ejecutado; el diff de `.adonisjs/` es solo el esperado
- [ ] No se añadieron rutas a `shield.csrf.exceptRoutes` sin justificación

## Sesión y auth

- [ ] Las rutas nuevas están en el grupo correcto (`auth` o `guest`)
- [ ] Las operaciones de escritura exigen CSRF
- [ ] No se expone `password`, token ni `SUPABASE_DB_URL` en props, logs ni mensajes

## Acceso a datos

- [ ] Entradas validadas (VineJS) antes de tocar la base de datos
- [ ] Consultas parametrizadas; `LIKE` escapado con `escapeLike()`
- [ ] Consultas al catálogo envueltas en `withConnectionRetry()`
- [ ] Nada escribe en la conexión `supabase`
- [ ] Si cambió el esquema: migración + `down()` + `database/schema.ts` regenerado
- [ ] No se editó `database/schema.ts` a mano

## Cliente

- [ ] El nombre de la página existe en `inertia/pages/`
- [ ] `Link` y `Form` importados de `@adonisjs/inertia/react`
- [ ] Los estilos van a `inertia/css/app.css`, no a un `<style>` inline
- [ ] Los iconos pasan por `~/components/icon`
- [ ] Si el `<form>` tiene 2+ campos sin botón submit, se intercepta `onKeyDown` para Enter
- [ ] Si el `<form>` debe ser horizontal, hay override de `flex-direction`
- [ ] No se añadieron estilos que dependan de selectores globales frágiles

## Documentación

- [ ] Documento del módulo actualizado
- [ ] `docs/01-requirements/traceability.md` al día
- [ ] Estado del documento actualizado
- [ ] ADR creado si la decisión tiene alternativas con trade-offs

## Higiene

- [ ] `npm run lint` y `npm run typecheck` en verde
- [ ] Sin `console.log` olvidados
- [ ] Sin secretos ni `tmp/` ni `public/assets` en el diff
- [ ] Comentarios explican el porqué, no el qué

## Referencias
- [Definición de terminado](definition-of-done.md)
- [Guías de desarrollo](development-guidelines.md)
- [Flujo de trabajo Git](git-workflow.md)
