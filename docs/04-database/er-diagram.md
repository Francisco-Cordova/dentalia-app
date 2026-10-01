# Diagrama entidad-relación

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2332e22 |

El modelo se divide en **dos bases de datos sin relación entre sí**. Por eso el diagrama se
presenta en dos bloques y no en un único grafo.

## Base de datos de autenticación (SQLite)

```mermaid
erDiagram
    USERS ||--o{ MAGIC_LINKS : "user_id (ON DELETE CASCADE)"

    USERS {
        integer id PK "autoincrement"
        varchar full_name "nullable"
        varchar email UK "not null, 254"
        varchar password "not null, hash scrypt"
        datetime created_at "not null"
        datetime updated_at "nullable"
    }

    MAGIC_LINKS {
        integer id PK "autoincrement"
        integer user_id FK "nullable, cascade"
        varchar token_hash UK "not null, sha256 hex 64"
        datetime expires_at "not null, +30 min"
        datetime used_at "nullable, null = vigente"
        datetime created_at "not null"
        datetime updated_at "nullable"
    }
```

Leyenda: `PK` clave primaria, `FK` clave foránea, `UK` único.

### Cardinalidad
- Un `USERS` tiene 0..N `MAGIC_LINKS`. El cero es real: un usuario recién creado por `/signup`
  no tiene enlaces hasta que pide uno.
- Un `MAGIC_LINKS` pertenece a 0..1 `USERS` porque la columna es nullable en el esquema (aunque la
  aplicación siempre la escribe).

## Base de datos de catálogo (Supabase, solo lectura)

```mermaid
erDiagram
    INSUMOS {
        numeric ID PK "orden asc"
        text NAME "buscable"
        text DEFAULT_CODE "buscable como ID"
        text MARCA
        numeric CANTIDAD
        numeric UNIT_COST
        timestamp modified_at "no usada por la UI"
    }

    KITS {
        bigint id PK "7..136, disperso"
        timestamptz created_at "no usada por la UI"
        text Nombre "buscable"
        text ID_odoo "buscable como ID"
        real Costo "nullable: 3 filas NULL"
        text Descripcion "leida, no mostrada"
        text Insumos "lista de DEFAULT_CODE, no es un numero"
    }

    ZONAS {
        bigint id PK "1..2"
        text nombre "buscable"
        text descripcion "leida, no mostrada"
        real costo "existe pero la app no lo expone: NULL en las 2 filas"
        timestamptz created_at "no usada por la UI"
    }

    CLINICAS_ZONAS {
        bigint clinica_id FK "a public.clinicas.id"
        bigint zona_id FK "a public.zonas.id"
        timestamptz created_at
    }
```

### Sin relación entre `INSUMOS` y `KITS`
No hay clave foránea. La composición de un kit se codifica **dentro del texto** de
`KITS."Insumos"`, como códigos separados por coma:

```mermaid
flowchart LR
    K["KITS id=7<br/>Insumos = 'M2625 , M1711 , M2203'"]
    K -.->|"split por coma"| C1["INSUMOS DEFAULT_CODE = M2625"]
    K -.-> C2["INSUMOS DEFAULT_CODE = M1711"]
    K -.-> C3["INSUMOS DEFAULT_CODE = M2203"]
    N1["(no hay cantidad)"]
    K -.-> N1
```

La consecuencia es que no se puede validar desde la base que un código exista, ni conocer la
cantidad de cada insumo. Esa información vive en `public."Kits"`, tabla desnormalizada con
`id_kit`, `id_insumo` y `Cantidad requerida numero`, que la aplicación todavía no consulta.

`INSUMOS` y `KITS` son **entidades aisladas**: no tienen claves foráneas hacia otras tablas de la
aplicación y no se relacionan con `USERS`.

### Relación real: `ZONAS` ↔ `CLINICAS_ZONAS`

A diferencia de insumos y kits, el catálogo de zonas **sí tiene una relación con FKs reales**
(verificadas en `information_schema`), aunque vive en el schema `public`:

```mermaid
flowchart LR
    Z["ZONAS id=1 (Turista)"] -->|"1:N zona_id"| CZ["CLINICAS_ZONAS 7 filas"]
    Z2["ZONAS id=2 (Nacional)"] -->|"1:N zona_id"| CZ2["CLINICAS_ZONAS 6 filas"]
    CZ --> C1["public.clinicas ACOXPA, ALTABRISA, ..."]
```

- `public.clinicas_zonas.clinica_id → public."clinicas".id` y
  `public.clinicas_zonas.zona_id → public."zonas".id`. 13 filas, sin duplicados ni huérfanos.
- La app lee `dev."zonas"` (el `searchPath` pone `dev` primero; `public."zonas"` es un duplicado
  exacto) y **cuenta** las filas de `public.clinicas_zonas` por `zona_id` con una subconsulta
  correlacionada. No escribe en ninguna de las dos.
- Ojo: la FK de `zona_id` apunta a `public."zonas"`, no a `dev."zonas"`. Hoy son idénticas, pero
  son tablas distintas: si Odoo escribiera en una sola, el conteo y el listado podrían divergir.

### `MODULOS_SALUD`: entidad aislada, sin relación con los SKUs

```mermaid
flowchart LR
    M["MODULOS_SALUD 10 filas<br/>PERIODONCIA, ORTODONCIA, ..."]
    S["public.SKU 255 filas"]
    M -.->|"NO HAY FK:<br/>no se puede contar<br/>cuántos SKUs tiene cada módulo"| S
```

- `dev.modulos_salud` **no tiene ninguna FK** que entre ni salga (verificado en
  `information_schema`). `public.modulos_salud` es un duplicado exacto, no una tabla de detalle.
- La referencia de diseño muestra el conteo de SKUs por módulo, pero **`public."SKU"` tampoco tiene
  columna ni FK hacia un módulo**: no hay forma de calcularlo. La pantalla muestra `0` como dato
  dummy (`SKUS_DUMMY` en el frontend), no un conteo real.
- Es la misma situación que `INSUMOS` y `KITS`: entidad aislada, sin FKs hacia otras tablas de la
  aplicación.

## Entidades que NO existen en el modelo

| Concepto de la UI | ¿Entidad? | Nota |
|---|---|---|
| SKU | **No** | Pantalla `skus` con props `{}` |
| Familia | **No** | Pantalla `familias` con props `{}` |
| Detalle de insumos por kit | **No** | Existe `public."Kits"` en Supabase (con cantidades), pero la app solo lee `dev."Kits"` |
| Usuario de negocio (del catálogo) | **No** | `users` es solo auth; la pantalla `usuarios` está vacía |
| Clínica | **No** | `public."clinicas"` existe y es el destino de la FK de `clinicas_zonas`, pero la app no la consulta |
| Sesión | **No** | `SESSION_DRIVER=cookie`: vive en una cookie cifrada, no en una tabla |

## Referencias
- [Diccionario de datos](data-dictionary.md)
- [Diseño de base de datos](database-design.md)
