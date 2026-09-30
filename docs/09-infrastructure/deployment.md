# Deployment

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | `7bb5ecb` |

## Conclusión

**No existe proceso de despliegue.** No hay CI, ni CD, ni `.github/`, ni Dockerfile, ni
`infra/`, ni script de release. La aplicación se ejecuta con `npm run dev` en la máquina del
desarrollador y no se ha construido nunca en modo producción.

## Pipeline

```
┌──────────┐   ┌───────┐   ┌──────────┐   ┌──────┐   ┌─────────┐   ┌────────┐
│  Build   │──▶│ Lint  │──▶│ Typecheck│──▶│Tests │──▶│ Security│──▶│ Deploy │
└──────────┘   └───────┘   └──────────┘   └──────┘   └─────────┘   └────────┘
     ✅            ✅           ✅           ❌          ❌            ❌
   existe       `npm run     `npm run    sin specs   sin scan    sin pipeline
               lint`        typecheck`   (`npm test`  ni SCA
                                            no ejecuta)
```

| Etapa | Herramienta | Estado |
|---|---|---|
| Build | `npm run build` (`node ace build`) | **Existe**, nunca ejecutado en modo producción |
| Lint | `npm run lint` | **Existe**, manual |
| Typecheck | `npm run typecheck` | **Existe**, manual |
| Tests | `npm test` (`node ace test`) | **Vacío**: no hay `*.spec.ts`, la etapa pasa sin ejecutar nada |
| Security scan | — | **No existe**: ni `npm audit`, ni SAST, ni SCA |
| Quality gate | — | **No existe** |
| Deploy | — | **No existe** |

Detalle importante: la etapa de tests **no falla** porque no hay nada que ejecutar. Un pipeline que
solo ejecute `npm test` dará verde con cobertura cero.

## DEV

| Paso | Comando | Estado |
|---|---|---|
| Instalar | `npm install` | Manual |
| Configurar | `.env` desde `.env.example` | Manual, no versionado |
| Esquema | `node ace migration:run` | Manual |
| Datos | `node ace db:seed` | Manual |
| Ejecutar | `npm run dev` | Manual, HMR |

## PROD

Ninguno de estos pasos se ha ejecutado nunca:

| # | Paso | Comando | Notas |
|---|---|---|---|
| 1 | Construir | `npm run build` | Genera `build/` y `public/assets`. `metaFiles` ya copia `resources/views/**/*.edge` y `public/**` |
| 2 | Migrar la base de auth | `node ace migration:run` | **Bloqueante**: necesita un volumen persistente (ver [environments.md](environments.md)) |
| 3 | Sembrar | `node ace db:seed` | **No en PROD**: crearía un usuario de pruebas con magic link habilitado |
| 4 | Arrancar | `npm start` (`node bin/server.js`) | `bin/server.ts` gestiona `SIGTERM` y `SIGINT` si corre bajo PM2 |
| 5 | TLS | — | **No definido**. Sin él, HSTS y las cookies `Secure` rompen el login |
| 6 | Proxy inverso | — | **No definido**. Implica activar `trustProxy` |

### Comprobaciones obligatorias antes de exponer el servicio

Ninguna automatizada:

- [ ] `NODE_ENV=production` (si no, CORS refleja cualquier origen con `credentials`)
- [ ] `SESSION_DRIVER=cookie` (el valor `database` no funciona)
- [ ] Las cookies salen con `Secure` y `HttpOnly`
- [ ] `/insumos` devuelve 200 con sesión
- [ ] El magic link llega y se consume **una sola vez**
- [ ] `/` con sesión ya no muestra el detalle de los errores
- [ ] `.env` no está en el artefacto desplegado
- [ ] `APP_KEY` del ambiente correcto (no el de DEV)
- [ ] La cookie de sesión sobrevive a un reinicio del proceso

## Aprobaciones

**No hay proceso de aprobación.** No hay revisores, ni entorno de preproducción, ni criteria de
aprobación. Ver [stakeholders.md](../00-project/stakeholders.md): el único actor conocido aprueba
su propio código.

## Referencias
- [Infraestructura](infrastructure.md)
- [Ambientes](environments.md)
- [Rollback](../10-operations/rollback.md)
- [Definición de terminado](../07-development/definition-of-done.md)
- [Git workflow](../07-development/git-workflow.md)

## Brechas

- **No hay despliegue**: el sistema nunca ha corrido fuera de una máquina de desarrollo.
- **El pipeline tiene una etapa que pasa en verde sin hacer nada**: `npm test` no detecta la ausencia
  de tests. Un pipeline futuro debe fallar si no hay specs, no dejarlos pasar.
- **Sin gate de seguridad**: no hay `npm audit`, ni revisión de dependencias.
- **Sin versionado de artefactos**: no hay tags, ni registro de imágenes, ni forma de saber qué
  versión está desplegada.
- **Sin rollback probado**: ver [rollback.md](../10-operations/rollback.md).
- **Sin aprobación**: quien despliega es quien desarrolla y quien revisa.
- **La migración a PROD tiene un bloqueante conocido** (volumen persistente para SQLite) sin
  resolver.
