# Estrategia de pruebas

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Conclusión

**No existe estrategia de pruebas implementada.** El proyecto tiene Japa instalado y
configurado (`node ace test` funciona), pero `tests/` contiene únicamente `bootstrap.ts`: **cero
archivos `*.spec.ts`**. `npm test` arranca y termina sin ejecutar nada.

No hay QA, no hay UAT. Quien desarrolla es quien verifica.

## Niveles: objetivo vs. realidad

| Nivel | Objetivo | Responsable | Automatización real | Momento real |
|---|---|---|---|---|
| Unit | Lógica aislada: `escapeLike()`, validadores, paginación | Dev | **Ninguna** | Manual, al escribir el código |
| Integration | Componentes, BD, rutas, Inertia props | Dev/QA | **Ninguna** | Smoke por HTTP manual |
| E2E | Flujo crítico completo | QA/Dev | **Ninguna** | Manual, con un script throwaway |
| Performance | Capacidad y latencia | — | **Ninguna** | Nunca se ha hecho |
| Security | Controles implementados | Dev | **Parcial**: ver [security-testing.md](security-testing.md) | Manual, por Check de auth, CSRF y CORS |
| Acceptance | Criterios de negocio | QA + negocio | **Ninguna** | Sin proceso |

## Qué hay disponible para escribir pruebas

| Recurso | Estado |
|---|---|
| Japa + `@japa/assert` | Instalados y con runner (`tests/bootstrap.ts` importa `japaApi`) |
| `@japa/api-client` | Instalado → permite probar rutas HTTP |
| `@japa/spec-reporter` | Instalado |
| Suite de browser | **No instalada**: no hay Playwright ni WebdriverIO en `devDependencies` |
| ESM en los tests | **No**: los tests deben escribirse en CommonJS (`import ... = require(...)`) porque `package.json` no declara `"type": "module"` |
| `tests/bootstrap.ts` | Importa `japaApi`, `assert`, `apiClient` y `specReporter`; configurado con `files: ['tests/**/*.spec.ts']` |

## Cobertura actual de las rutas

Las 14 rutas solo se han verificado a mano, en DEV, por HTTP. No hay nada que lo repita.

| Ruta | Verificación existente |
|---|---|
| `GET /` | Manual (smoke) |
| `POST /login/magic` | Manual: email no registrado → 302 sin correo; registrado → correo enviado |
| `GET /auth/magic/:token` | Manual: válido → 302 a `/skus`; inválido/expirado → 200 con error en el prop; reutilizado → rechazado |
| `GET /signup`, `POST /signup` | Manual: crea usuario, hashea contraseña, inicia sesión |
| `POST /logout` | Manual: sin XSRF la sesión sobrevive; con XSRF válido se destruye |
| `GET /insumos` | Manual: paginación, filtros, búsqueda con `escapeLike()` |
| Resto del panel (8 rutas) | Manual: solo que devuelvan 200 con sesión |
| CORS | Manual: preflight en DEV refleja cualquier origen con `credentials` |
| `router.on()` no acepta otros verbos | Manual: POST/PUT/DELETE/PATCH → 404 |

## Plan de introducción

Orden sugerido por relación esfuerzo/valor. Ningún paso está empezado.

| # | Paso | Valor | Esfuerzo |
|---|---|---|---|
| 1 | Specs unitarias de `escapeLike()` y del paginado de insumos | Son la lógica con más riesgo de inyección/bug | Bajo |
| 2 | Specs de rutas con `@japa/api-client`: magic link completo (pedir → consumir → reutilizar) | El flujo con más estados y sin cobertura | Medio |
| 3 | Specs de que `/insumos` respeta filtros y devuelve los props del contrato | Contrato Inertia documentado en `http-contracts.md` | Medio |
| 4 | Specs de CSRF (logout sin token no destruye sesión) | Control de seguridad crítico | Bajo |
| 5 | Suite de browser para el login completo | Cubre el flujo E2E de verdad | Alto (instalar Playwright) |

## Referencias
- [Casos de prueba](test-cases.md)
- [Integration testing](integration-testing.md)
- [E2E testing](e2e-testing.md)
- [Security testing](security-testing.md)
- [Definición de terminado](../07-development/definition-of-done.md)
- `tests/bootstrap.ts`, `adonisrc.ts`

## Brechas

- **Cobertura cero en todos los niveles**: ninguna lógica tiene prueba.
- **No hay pipeline**: aunque se escribieran specs, no hay CI que los ejecute (ver
  [git-workflow.md](../07-development/git-workflow.md)).
- **No hay suite de browser**: el E2E real (navegador) es imposible sin instalar Playwright.
- **Los tests tendrían que ir en CommonJS**: detalle no documentado que hará fallar el primer spec
  copiado de un tutorial de ESM.
- **No hay datos de prueba para Supabase**: `withConnectionRetry()` y la búsqueda sobre
  `dev."Insumos"` se prueban contra la tabla real de producción (de solo lectura), lo que impide
  casos que necesiten escritura y hace que los resultados dependan del contenido del catálogo.
- **No hay política de datos de prueba** para auth: la única forma de tener un usuario con sesión es
  insertar un token en `tmp/db.sqlite3` a mano.
