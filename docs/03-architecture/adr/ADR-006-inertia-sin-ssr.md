# ADR-006 · SPA de Inertia sin SSR

- Estado: Accepted
- Fecha: 2026-09-30
- Decisores: Dev owner

## Contexto
El panel es una aplicación interna detrás de autenticación por magic link: no hay contenido público
que indexar, no hay SEO, y la audiencia es un equipo pequeño que ya usa SPA. Inertia permite
escribir páginas React que el servidor renderiza como HTML en la primera carga y como JSON en
navegaciones posteriores, manteniendo un solo código de UI.

## Opciones consideradas

### Opción A · SPA de Inertia sin SSR
- Ventajas:
  - Un solo código de UI (React) y una sola ruta por pantalla.
  - Sin motor de render en Node: menos superficie y menos CPU en el servidor.
  - El servidor devuelve solo datos (props); el filtro y la paginación viajan como query string.
- Desventajas:
  - Sin HTML renderizado en el servidor: la primera carga es más lenta (bundle) y no hay
    contenido público indexable (irrelevante aquí).

### Opción B · SSR de Inertia
- Ventajas: primera carga más rápida, mejor SEO.
- Desventajas:
  - Motor de render adicional en producción; coste de CPU/RAM.
  - Con magic link, las páginas están detrás de sesión y de CSRF: el SSR no aporta valor.
  - `inertia/ssr.tsx` tendría que importar CSS y fuentes para no servir páginas sin estilos
    (hoy no lo hace, y SSR está desactivado).

### Opción C · SPA sin Inertia (React Router + API JSON)
- Ventajas: control total del cliente.
- Desventajas: obliga a construir y mantener una API JSON; duplica la lógica de serialización.
  Contradice [ADR-001](ADR-001-driver-postgres-lucid.md).

## Decisión
**Opción A**: SSR desactivado (`config/inertia.ts:ssr.enabled = false`). El servidor devuelve
HTML en la primera carga y JSON en navegaciones Inertia. Las páginas se resuelven por nombre con
`resolvePageComponent` sobre `import.meta.glob` (lazy). No hay estado global en el cliente.

## Consecuencias

### Positivas
- Menos piezas en producción: sin render en Node.
- Los controllers devuelven props planas y el cliente conserva filtros/página en la URL.
- Coherente con la autenticación por sesión: no hace falta renderizar para bots.

### Negativas / trade-offs
- La primera carga depende del bundle (Vite) y hay una perceptible pausa inicial.
- `inertia/ssr.tsx` es código muerto hoy; si alguien activa SSR, serviría páginas sin estilos
  (el archivo no importa `app.css`).
- Sin estado global (ni Redux/Zustand): el estado vive en la URL y en `usePage().props`.

## Revisión
Reconsiderar si el panel se vuelve público, si hay usuarios en redes lentas o si el SEO pasa a ser
un requisito.

## Referencias
- [frontera HTTP Inertia](../../05-api/http-contracts.md)
- [config/inertia.ts](../../../config/inertia.ts)
