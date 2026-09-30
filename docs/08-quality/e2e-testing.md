# E2E Testing

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Estado

**No hay pruebas E2E.** No hay suite de navegador: Playwright y WebdriverIO no están en
`devDependencies`, no existe `playwright.config.ts` ni `wdio.conf.ts`, y no hay ningún
`*.e2e.spec.ts`.

Lo que se ha hecho como equivalente es una navegación manual por HTTP con la cookie de sesión,
usando scripts throwaway fuera del repositorio. Eso no es E2E: no ejecuta JavaScript, no renderiza
React y no comprueba lo que ve el usuario.

## Flujos críticos que deberían estar cubiertos

| # | Flujo | Pasos | Por qué es crítico |
|---|---|---|---|
| 1 | Login por magic link | `/` → enviar correo → abrir el enlace → panel | Es el único camino de acceso al producto |
| 2 | Rechazo de enlace inválido o ya usado | abrir el enlace dos veces | Es el control que impide reutilizar un enlace filtrado |
| 3 | Correo no registrado | enviar con un email desconocido | Evita que el login sea un enumerador de cuentas |
| 4 | Logout | cerrar sesión → intentar volver al panel | Control de sesión y CSRF |
| 5 | Búsqueda del catálogo | `/insumos` → escribir → Enter → ver resultados filtrados | Depende del `onKeyDown` porque el `<form>` no hace submit implícito |
| 6 | Paginación del catálogo | avanzar páginas y volver | Contracto de `page`/`lastPage` |
| 7 | Alta de cuenta | `/signup` → registrar → entrar al panel | Ruta activa sin enlace en la UI |
| 8 | Navegación del sidebar | recorrer las 9 secciones del panel | Un nombre de ruta perdido rompe el enlace en silencio |

## Ambientes

| Ambiente | Existe | Notas |
|---|---|---|
| DEV (local, `localhost:3333`) | Sí | Único ambiente. Datos de auth en `tmp/db.sqlite3` |
| Staging / QA | **No** | — |
| UAT | **No** | — |
| PROD | **No** | No hay despliegue ni infraestructura |

## Automatización

| Pieza | Estado |
|---|---|
| Playwright | No instalado |
| Configuración | No existe |
| Datos de prueba | No hay usuario de pruebas por defecto más allá del seeder |
| Manejador de correo | Ninguno: sin un buzón de pruebas, el paso "abrir el correo" no es automatizable |
| Reporte | No hay |

Para automatizar el flujo 1 hace falta decidir: o un buzón de pruebas (Mailtrap, Mailhog,
Supabase) donde el bot lea el token, o un mecanismo de bypass en DEV. Ambas opciones son trabajo no
hecho.

## Referencias
- [Estrategia de pruebas](test-strategy.md)
- [Integration testing](integration-testing.md)
- [Casos de prueba](test-cases.md)
- [Flujo de autenticación](../02-functional-design/flows/FLOW-AUT-001.md)

## Brechas

- **Cobertura E2E nula**: ningún flujo crítico tiene prueba automatizada.
- **No hay buzón de pruebas**: bloquea la automatización del flujo de login completo, que es el de
  mayor valor.
- **Un solo ambiente**: las pruebas correrían siempre contra la `tmp/db.sqlite3` local, sin forma de
  validar otro ambiente.
- **Sin suite de navegador instalada**: ni siquiera el andamiaje existe; hay que añadir la
  dependencia y su configuración.
- **Los scripts throwaway no son reutilizables**: vivían en `%TEMP%\opencode` y no se versionan, así
  que la verificación de una página depende de que alguien vuelva a escribirlo.
