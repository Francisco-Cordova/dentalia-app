# Definición de terminado

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

Checklist derivado de lo que la plataforma permite hoy. Las casillas marcadas como imposibles son
brechas, no omisiones.

## Código

- [ ] `npm run lint` sin errores
- [ ] `npm run lint -- --fix` no deja cambios pendientes
- [ ] `npm run typecheck` en verde (server + Inertia)
- [ ] Si se tocó `start/routes.ts`, `node ace codegen` ejecutado y el diff de `.adonisjs/` es el
      esperado (sin pérdida de nombres de ruta)
- [ ] Si se tocó el esquema, migración creada y `database/schema.ts` regenerado

## Comportamiento

- [ ] La ruta afectada verificada por HTTP (no hay suite automatizada que lo cubra)
- [ ] Los errores de validación siguen el patrón `errors.<campo>`
- [ ] Los mensajes al usuario van por `session.flash`, no por `console`
- [ ] Ningún dato sensible en logs ni en el prop compartido (`user` pasa por `UserTransformer`)

## Documentación

- [ ] Actualizado el documento del módulo en `docs/`
- [ ] Actualizado `docs/01-requirements/traceability.md` si cambió un requisito, una regla o una
      feature
- [ ] Actualizado el estado del documento correspondiente
- [ ] Si la decisión tiene alternativas y trade-offs, hay un ADR nuevo o actualizado

## Verificación de seguridad (cuando aplica)

- [ ] Entradas validadas con VineJS
- [ ] Operaciones de escritura siguen exigiendo CSRF (no se añadió ruta a `shield.csrf.exceptRoutes`)
- [ ] Consultas parametrizadas; `LIKE` con `escapeLike()`
- [ ] Consultas al catálogo dentro de `withConnectionRetry()`
- [ ] Nada nuevo se escribe en la conexión `supabase`

## Commit

- [ ] Mensaje en español, descriptivo del porqué
- [ ] Sin secretos, sin `tmp/`, sin `public/assets`
- [ ] Secretos y credenciales no aparecen en el mensaje ni en el diff

## Lo que hoy no se puede marcar

- [ ] **CI aprobado** — el proyecto no tiene CI (brecha)
- [ ] **QA/UAT completado** — no existe ambiente de pruebas (brecha)
- [ ] **Code Review aprobado** — no hay proceso formal; la auto-revisión no cuenta como aprobación
- [ ] **Cobertura de tests** — no hay `*.spec.ts`; `npm test` no ejecuta nada (brecha)
- [ ] **Reversión probada** — no hay procedure de rollback documentada ni probada

## Referencias
- [Estrategia de pruebas](../08-quality/test-strategy.md)
- [Checklist de revisión de código](code-review-checklist.md)
- [Guías de desarrollo](development-guidelines.md)
- [features/README.md](../features/README.md) (ciclo de vida de la feature)

## Brechas

- **El checklist depende de disciplina manual**: los últimos cuatro puntos no se pueden cumplir, y
  nada en el proceso impide mergear sin ellos.
- **La verificación de comportamiento es manual y efímera**: un smoke por HTTP no queda registrado,
  así que una regresión puede volver sin que nadie lo note.
- **Sin prueba de reversión**: no se sabe si un `migration:rollback` funciona.
