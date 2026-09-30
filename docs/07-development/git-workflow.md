# Flujo de trabajo Git

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Estado actual

| Aspecto | Situación |
|---|---|
| Rama de trabajo | `master` |
| Ramas de feature | No se usan |
| Commits | Directos a `master`, mensajes en español y descriptivos |
| Pull requests | No hay proceso formal; no hay `CONTRIBUTING.md` |
| Hooks | No hay hooks de commit ni de pre-commit versionados |
| CI | **No existe** |
| Versionado de releases | No hay tags |

## Historial (completo)

| Commit | Contenido |
|---|---|
| `2332e22` | Documentación inicial en `docs/`, `AGENTS.md`, y nombre de ruta `session.destroy` |
| `5b4f99b` | Reconexión de Supabase ante pérdida de sesión con la BD |
| `2278659` | Integración con Supabase para consultar insumos y buscadores |
| `9d07876` | Login y primer dashboard de SKUs |

## Convención de mensajes observada

Español, tercera persona del plural o impersonal, sin prefijo conventional-commit:

```
Se agregó documentación inicial en docs y se corrigió el nombre de la ruta de logout
Se hizo la modificación para que si se pierde la sesion con la base de datos reconecte y no mande error
Se hizo integración con supabase para consulta de insumos, y se agregaron las funcionalidades a los buscadores
```

Los cuerpos largos se usan para explicar el porqué (ver el commit `2332e22`).

## Archivos que nunca deben versionarse

| Ruta | Motivo |
|---|---|
| `.env` | Secretos |
| `tmp/*` | Contiene `db.sqlite3` (cuentas y magic links) y los `.log` del servidor |
| `public/assets` | Bundle compilado |
| `node_modules` | Dependencias |
| `build` | Build de producción |

Verificado: `git log --all -- .env` → **0 commits**. El historial está limpio.

## Archivos versionados que no parece obvious

| Ruta | Motivo |
|---|---|
| `.adonisjs/**` | Tipos y registro de rutas **generados** pero versionados a propósito: sin ellos el typecheck de otro clon no funciona. Por eso `node ace codegen` debe ejecutarse y su diff revisarse |
| `Plantillas/**` | Referencia de diseño (HTML + assets del origen) |
| `database/schema.ts` | Esquema Lucid generado |

## Referencias
- [Entorno de desarrollo](development-environment.md)
- [Definición de terminado](definition-of-done.md)
- `AGENTS.md`

## Brechas

- **Sin CI**: nada impide un merge con lint o typecheck en rojo. La verificación es manual.
- **Sin hooks**: nada formatea ni valida antes del commit.
- **Sin PR ni revisión por pares**: los cambios llegan a `master` sin segundo par de ojos. El
  checklist de [code-review-checklist.md](code-review-checklist.md) existe pero es una guía
  personal, no un proceso aplicado.
- **Sin `.adonisjs` documentado como generado**: quien haga `git checkout .adonisjs` después de un
  codegen parcial puede romper el typecheck de formas confusas.
- **Sin política de rollback**: no hay guía de qué hacer si un commit llegó a `master` con un
  secreto o un bug.
- **Rama única**: sin ramas, un cambio grande mezclado con uno pequeño hace imposible revertir solo
  uno.
