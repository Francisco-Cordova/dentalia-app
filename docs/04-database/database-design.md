# Diseño de base de datos

> **Propósito:** Documentar el modelo lógico y decisiones de persistencia.

> Reemplaza los textos entre `< >`. Elimina las secciones que no apliquen y registra cualquier decisión relevante.

## Control del documento

| Campo | Valor |
|---|---|
| Estado | DRAFT |
| Responsable | <nombre/rol> |
| Última actualización | <YYYY-MM-DD> |
| Versión relacionada | <versión/release> |

## Motor

<PostgreSQL/MySQL/etc. y justificación>

## Convenciones

<nombres, IDs, timestamps, auditoría>

## Entidades principales

- <entidad>: <responsabilidad>

## Relaciones y cardinalidad

<resumen>

## Constraints

- <constraint/regla>

## Índices

| Tabla | Índice | Motivo |
|---|---|---|
| < > | < > | < > |

## Soft delete

<dónde aplica y por qué>

## Migraciones

Los scripts ejecutables viven en `/database/migrations`.

## Riesgos/volumen

<crecimiento, particionado, retención, etc.>
