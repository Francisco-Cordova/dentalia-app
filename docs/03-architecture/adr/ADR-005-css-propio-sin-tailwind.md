# ADR-005 · CSS propio sin Tailwind

- Estado: Accepted
- Fecha: 2026-09-30
- Decisores: Dev owner

## Contexto
La interfaz replica el diseño de un catálogo Bubble original. El requisito de diseño es que las
pantallas se vean **igual** al original, y ese HTML está versionado en `Plantillas/<seccion>/`
con sus assets. Tailwind ofrece una forma rápida de construir UI, pero introduce su propia
vocabulario de clases y decisiones de escala que no corresponden al diseño de origen.

## Opciones consideradas

### Opción A · CSS propio en `inertia/css/app.css`
- Ventajas:
  - Réplica directa de los estilos del HTML original (clases, jerarquía, variables).
  - Sin dependencia extra ni paso de compilación de utilidades.
  - Un solo lugar donde revisar estilos (1,082 líneas).
- Desventajas:
  - Escala peor que un sistema de utilidades.
  - Sin encapsulación por componente: los estilos son globales por definición.

### Opción B · Tailwind
- Ventajas: marcado más corto, tokens de diseño consistentes.
- Desventajas:
  - No corresponde al CSS del original; habría que replicar su apariencia con utilidades.
  - Dependencia y configuración extra.
  - Riesgo de divergir del diseño, que es el objetivo del proyecto.

### Opción C · CSS Modules / estilos por componente
- Ventajas: encapsulación por pantalla.
- Desventajas: rompe la fidelidad con el CSS original y añade ceremonia.

## Decisión
**Opción A**: todo el CSS vive en `inertia/css/app.css` (CSS plano). Se replica la estructura de
clases del HTML original. Sin Tailwind ni CSS modules.

Consecuencia operativa (documentada en `AGENTS.md`): dos reglas globales afectan **a todo** el
markup de página — `form { flex-direction: column }` y `label { display: block }` — por lo que un
`<form>` con varios campos necesita un override (`.insumos-toolbar { flex-direction: row }`).

## Consecuencias

### Positivas
- Fidelidad verificable contra `Plantillas/`.
- Cero dependencias de estilos.

### Negativas / trade-offs
- Mantener un archivo de 1,000+ líneas y estilos globales es frágil (trampa ya conocida para
  futuros cambios de layout).
- Sin tokens compartidos: los colores/espaciados se repiten literalmente.

## Revisión
No se revisa mientras el objetivo sea replicar el original. Reconsiderar si la mantenibilidad
(equipo grande, muchas pantallas nuevas) pasa por encima de la fidelidad.
