# Guías de desarrollo

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

## Reglas que el lint impone

| Regla | Consecuencia práctica |
|---|---|
| `@unicorn/filename-case` | Los archivos van en `snake_case`: `insumos_controller.ts`, `modulos_de_salud.tsx`. **Incluye los `.tsx` de página** |
| `@adonisjs/prefer-adonisjs-inertia-link` | `Link` y `Form` se importan de `@adonisjs/inertia/react`, nunca de `@inertiajs/react` |
| `usePage` sí viene de `@inertiajs/react` | Excepción explícita |
| Lint y typecheck en el mismo gate | `npm run typecheck` corre `tsc` por separado sobre el server y sobre Inertia |

## Convenciones de código

### Navegación
```tsx
<Link route="insumos" />                       // enlace
router.get({ route: 'insumos', qs })          // navegación con query
<Form route="session.destroy">                 // formulario con CSRF
```
`route()` viene de `@tuyau/core`; los nombres se resuelven desde `.adonisjs/client/registry`.

### Páginas Inertia
- El nombre que se pasa a `renderInertia()` **debe** coincidir con el archivo en `inertia/pages/`.
  Si el archivo está en un subdirectorio, el nombre incluye la ruta: `auth/login`.
- Los tipos de props usan `InertiaProps<T>` de `inertia/types.ts`.
- Los datos compartidos (`user`, `errors`, `flash`) ya están tipados; no redeclararlos.

### Estilos
- Todo el CSS vive en `inertia/css/app.css`. Sin Tailwind, sin CSS modules, sin estilos inline
  para el layout (ver [ADR-005](../03-architecture/adr/ADR-005-css-propio-sin-tailwind.md)).
- Iconos: siempre el wrapper `inertia/components/icon.tsx` (set cerrado). No añadir otra librería.
- Los toasts los emite `inertia/layouts/default.tsx` leyendo `flash`; las páginas no deben
  mostrarlos por su cuenta.

### Modelos
- `app/models/` extiende las clases de `database/schema.ts`, que son **generadas**: no editar.
- Cualquier cambio de esquema pasa por migración → `node ace codegen` → ajustar el modelo.

### Rutas
- Toda ruta que el cliente referencie por nombre necesita `.as('nombre')`.
- Tras tocar `start/routes.ts`, ejecutar `node ace codegen` y comprobar que `.adonisjs/` cambia
  como se espera. Si el diff es inesperado, es que falta un `.as()`.

## Proceso de verificación

```bash
npm run lint -- --fix
npm run typecheck
npm run dev    # y smoke de la ruta afectada
```

Ver [definición de terminado](definition-of-done.md) para el checklist completo.

## Referencias
- [Entorno de desarrollo](development-environment.md)
- [Flujo de trabajo Git](git-workflow.md)
- [Checklist de revisión de código](code-review-checklist.md)
- [Estándares de código](coding-standards.md)
- `AGENTS.md` (mismas reglas, en formato operable)

## Brechas

- **Sin formatter aplicado de forma consistente**: existe `npm run format`, pero el código
  versionado mezcla estilos. Nadie verifica que se ejecute antes de commitear.
- **Sin linter para el contenido de las plantillas de `Plantillas/`**: son HTML de referencia y
  pueden modificarse sin que nada avise.
- **Sin regla de lint que prohíba `console.log`**: los `console.log` en controllers pasan el filtro.
- **La documentación depende de disciplina manual**: nada comprueba que un cambio venga acompañado
  de su actualización en `docs/` (ver la regla de `AGENTS.md`).
- **Sin convención documentada para los nombres de los commits más allá del idioma**: los commits
  existentes son descriptivos en español, pero no hay `commitlint` que lo haga cumplir.
