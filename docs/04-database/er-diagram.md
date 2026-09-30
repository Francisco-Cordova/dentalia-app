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
```

`INSUMOS` es una **entidad aislada**: no tiene claves foráneas hacia otras tablas de la aplicación
y no se relaciona con `USERS`. No hay forma de saber, desde este repositorio, con qué otras
tablas del catálogo se enlaza (propiedad del equipo dueño de Supabase).

## Entidades que NO existen en el modelo

| Concepto de la UI | ¿Entidad? | Nota |
|---|---|---|
| SKU | **No** | Pantalla `skus` con props `{}` |
| Familia | **No** | Pantalla `familias` con props `{}` |
| Kit de insumos | **No** | Pantalla `kits` con props `{}` |
| Usuario de negocio (del catálogo) | **No** | `users` es solo auth; la pantalla `usuarios` está vacía |
| Zona | **No** | Pantalla `zonas` con props `{}` |
| Módulo de salud | **No** | Pantalla `modulos_de_salud` con props `{}` |
| Sesión | **No** | `SESSION_DRIVER=cookie`: vive en una cookie cifrada, no en una tabla |

## Referencias
- [Diccionario de datos](data-dictionary.md)
- [Diseño de base de datos](database-design.md)
