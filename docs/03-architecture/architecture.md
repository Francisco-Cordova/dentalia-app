# Arquitectura del sistema

> **Propósito:** Describir componentes, límites, responsabilidades y comunicación.

> Reemplaza los textos entre `< >`. Elimina las secciones que no apliquen y registra cualquier decisión relevante.

## Control del documento

| Campo | Valor |
|---|---|
| Estado | DRAFT |
| Responsable | <nombre/rol> |
| Última actualización | <YYYY-MM-DD> |
| Versión relacionada | <versión/release> |

## Contexto

<resumen>

## Estilo arquitectónico

<monolito modular / servicios / otro y justificación>

## Aplicaciones

- `apps/web`: <si aplica>
- `apps/mobile`: <si aplica>
- `apps/api`: <responsabilidad>
- `apps/worker`: <si aplica>

## Flujo de petición

Cliente → API → caso de uso → dominio → persistencia/integraciones → respuesta

## Comunicación

- Síncrona: <>
- Asíncrona: <>

## Archivos / cache / jobs / eventos

<decisiones>

## Manejo de errores

<estrategia>

## Restricciones

<restricciones arquitectónicas>
