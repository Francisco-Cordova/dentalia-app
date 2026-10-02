# UAT / Acceptance Testing

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Estado

**No hay UAT.** No hay proceso, no hay participantes, no hay criterios de entrada o salida, y no hay
evidencias. El proyecto no tiene un ambiente de pruebas: la única forma de ver el sistema es
`npm run dev` sobre la máquina de quien desarrolla.

| Pieza | Estado |
|---|---|
| Ambiente de pruebas | No existe |
| Participantes | No hay responsable de negocio identificado |
| Criterios de entrada | No definidos |
| Criterios de salida | No definidos |
| Evidencias | No se registran |
| Resultado | — |

## Lo que ocuparía su lugar

Si alguien pidiera validar el sistema hoy, esto es lo que se podría comprobar (todo sobre DEV, con
sesión válida salvo indicación):

| Área | Criterio verificable | Fuente |
|---|---|---|
| Autenticación | El magic link se envía, se consume una vez y caduca a los 30 min | [FLOW-AUT-001](../02-functional-design/flows/FLOW-AUT-001.md) |
| Autorización | Sin sesión, todo el panel redirige a `/` | [authorization.md](../06-security/authorization.md) |
| Catálogo | El buscador filtra por nombre y por código, pagina de 10 en 10 y escapa `%` y `_` | [FEATURE-001](../features/FEATURE-001-catalogo-insumos.md) |
| Navegación | Las 9 secciones del panel se alcanzan desde el sidebar y la sección activa se resalta | [requisito de UI](../01-requirements/) |
| Fidelidad visual | Cada pantalla coincide con `Plantillas/<seccion>/Dentalia catalogo digital.html` | [`Plantillas/`](../) |
| Errores | Las páginas 404 y 500 renderizan las pantallas de error propias | [error-catalog.md](../05-api/error-catalog.md) |

Nótese que casi todo lo que hoy se "acepta" es criterio técnico y verificable por quien
desarrolla. **No hay ningún criterio de aceptación de negocio**: nadie ha definido qué espera el
usuario final del catálogo, más allá de "que se vea el catálogo".

## Criterios de entrada propuestos

Sin implementar:

- [ ] Ambiente desplegado y accesible, con `NODE_ENV` equivalente al destino
- [ ] Datos de catálogo cargados
- [ ] Correo de prueba funcionando
- [ ] Build de producción generado y `npm start` verificado
- [ ] Documentación al día

## Criterios de salida propuestos

Sin implementar:

- [ ] Todos los criterios de aceptación de las features en `DONE` ejecutados y aprobados por
      negocio
- [ ] Sin hallazgos de seguridad abiertos de severidad alta o crítica
- [ ] Sin defectos abiertos de severidad alta o crítica

## Referencias
- [Estrategia de pruebas](test-strategy.md)
- [Casos de prueba](test-cases.md)
- [features/README.md](../features/README.md)
- [Entornos](../09-infrastructure/environments.md)

## Brechas

- **No hay criterios de aceptación de negocio escritos**: sin ellos, la validación de una feature en
  `DONE` no puede ser objetiva. Las features marcadas `DONE` lo están por decisión de desarrollo.
- **No hay ambiente de pruebas**: imposible validar nada que no sea el entorno local.
- **No hay participantes identificados**: nadie del negocio ha definido qué necesita.
- **Las features están en `DONE` sin UAT formal**: el ciclo de vida documentado salta de `READY` a
  `DONE` sin pasar por `CODE REVIEW` ni por UAT con alguien de negocio. Hay 6 features en `DONE`
  (001, 002, 003, 005, 007 y 008) y su evidencia es técnica: revisión manual del desarrollador en el
  navegador y scripts de humo. `FEATURE-006` (usuarios) sí quedó en `UAT` a la espera de esa
  revisión, pero sigue sin haber nadie de negocio que la haga.
