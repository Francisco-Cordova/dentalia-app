# Criterios de aceptación

## Control del documento

| Campo | Valor |
|---|---|
| Estado | ANALYZED |
| Responsable | Dev owner |
| Última actualización | 2026-09-30 |
| Versión relacionada | 2278659, 5b4f99b |

## Formato
**Dado** <contexto>
**Cuando** <acción>
**Entonces** <resultado verificable>

---

## AC-AUT-001 · El pedido de enlace no revela si el correo existe

- Dado el formulario de login
- Cuando se envía un correo que no está registrado
- Entonces la respuesta es el mismo mensaje genérico y redirect que con un correo registrado

**Evidencia esperada:** smoke HTTP: `POST /login/magic` con correo aleatorio responde 302 con el
mismo flash que un correo real, y no se crea fila en `magic_links`.

## AC-AUT-002 · El token se persiste solo como hash

- Dado una solicitud de enlace
- Cuando se crea el registro en `magic_links`
- Entonces `token_hash` es el sha256 del token (64 hex) y el token en claro no aparece en la BD

**Evidencia esperada:** script que inserta un token conocido y compara `token_hash` con
`createHash('sha256').update(token).digest('hex')`.

## AC-AUT-003 · El enlace vence a los 30 minutos

- Dado un enlace con `expires_at` en el pasado
- Cuando se abre `GET /auth/magic/:token`
- Entonces redirige a `/` con flash "El enlace es inválido o ya expiró" y no hay sesión

**Evidencia esperada:** script con `expires_at = ahora - 1 minuto` → 302 a `/` y `/skus` vuelve a
redirigir a `/`.

## AC-AUT-004 · El enlace es de un solo uso

- Dado un enlace recién verificado
- Cuando se abre el mismo enlace otra vez
- Entonces la segunda visita redirige a `/` con flash de error

**Evidencia esperada:** script que consume el mismo token dos veces y compara ambos códigos de respuesta.

## AC-AUT-005 · Verificar un enlace válido inicia sesión

- Dado un enlace vigente
- Cuando se abre `GET /auth/magic/:token`
- Entonces responde 302 a `/skus` y fija cookies de sesión (`adonis-session` + cookie cifrada de datos, `HttpOnly`, `SameSite=Lax`, `Max-Age=7200`)

**Evidencia esperada:** smoke HTTP verificado: 302 a `/skus` y `GET /skus` con la cookie → 200.

## AC-AUT-006 · Cerrar sesión invalida el acceso

- Dado una sesión activa
- Cuando se envía `POST /logout` con token CSRF válido
- Entonces responde 302 a `/`, limpia `remember_web` y las rutas protegidas vuelven a redirigir a `/`

**Evidencia esperada:** smoke HTTP verificado (login → logout → `/skus` = 302 a `/`).

## AC-AUT-007 · Cerrar sesión sin CSRF no destruye la sesión

- Dado una sesión activa
- Cuando se envía `POST /logout` sin header `x-xsrf-token`
- Entonces la petición se rechaza con redirect + flash de error y `GET /skus` sigue respondiendo 200

**Evidencia esperada:** smoke HTTP verificado + warning `Invalid or expired CSRF token` en el log
del servidor.

---

## AC-INS-001 · El listado trae datos reales del catálogo

- Dado un administrador autenticado
- Cuando abre `/insumos`
- Entonces la tabla muestra 10 filas del catálogo y el total corresponde al número real de registros (~5,060)

**Evidencia esperada:** `total.toLocaleString()` en la UI y respuesta 200 con los 10 registros.

## AC-INS-002 · La búsqueda por nombre ignora mayúsculas

- Dado el buscador "Buscar nombre"
- Cuando se busca `acrilico`, `ACRILICO` y `AcRiLiCo`
- Entonces las tres búsquedas devuelven el mismo conjunto de resultados

**Evidencia esperada:** smoke verificado: 22 resultados en los tres casos.

## AC-INS-003 · La búsqueda por código ignora mayúsculas

- Dado el buscador "Buscar ID"
- Cuando se busca `o0679` y `O0679`
- Entonces ambas devuelven el mismo único resultado

**Evidencia esperada:** smoke verificado: 1 resultado en ambos casos.

## AC-INS-004 · La búsqueda por comodin no devuelve el catálogo completo

- Dado el buscador "Buscar nombre"
- Cuando se busca `%`
- Entonces los resultados son los que contienen un símbolo `%` literal, no todas las filas

**Evidencia esperada:** comparación del total con el de `GET /insumos` sin filtros.

## AC-INS-005 · Los filtros y la página se combinan

- Dado un listado con filtros aplicados
- Cuando se cambia de página
- Entonces la nueva página mantiene `nombre` y `codigo` en la URL y en los resultados

**Evidencia esperada:** smoke HTTP verificando la query string y el contenido de la página 2.

## AC-INS-006 · Un texto sin coincidencias no rompe la pantalla

- Dado los buscadores
- Cuando no hay coincidencias
- Entonces se renderiza la tabla vacía con el total en cero y sin error de servidor

**Evidencia esperado:** smoke verificado: 0 resultados y respuesta 200.

## AC-INS-007 · La consulta sobrevive a un corte de conexión

- Dado un servidor con conexión a Supabase inactiva
- Cuando se cierra esa conexión desde el servidor y se vuelve a pedir `/insumos`
- Entonces la respuesta es 200 con datos, gracias a `keepAlive`, el pool y el reintento

**Evidencia esperada:** smoke que ejecuta `pg_terminate_backend` sobre la conexión de la app y
luego pide `/insumos` (verificado: 200 con 5,060 filas).

## AC-INS-008 · El catálogo se lee desde el schema `dev`

- Dado una conexión abierta a Supabase
- Cuando se ejecuta `SELECT current_schema()`
- Entonces devuelve `dev`, y `SHOW search_path` devuelve `dev, public`

**Evidencia esperada:** consulta directa a Supabase (verificado) y ausencia de `static schema`
en el modelo.

## AC-INS-009 · El catálogo no se puede escribir

- Dado la conexión `supabase`
- Cuando se intenta cualquier escritura
- Entonces no hay ruta ni servicio que la permita y no existen migraciones para esta conexión

**Evidencia esperada:** `migrations.paths: []` en `config/database.ts` y ausencia de métodos de
escritura en los modelos y controllers.

## AC-INS-010 · La búsqueda se dispara con Enter

- Dado el formulario de búsqueda, que tiene dos campos y ningún botón submit
- Cuando el usuario escribe y pulsa Enter
- Entonces se navega con los filtros aplicados

**Evidencia esperada:** `onKeyDown` en la página (un form con 2+ inputs sin submit no hace
implicit submission por defecto).

## AC-INS-011 · Los dos buscadores se ven en fila

- Dado la barra de herramientas de búsqueda
- Cuando se renderiza
- Entonces los campos quedan en línea horizontal, no apilados verticalmente

**Evidencia esperada:** override `.insumos-toolbar { flex-direction: row }` (la regla global
`form { flex-direction: column }` lo revierte).

---

## Brechas

- AC sin cobertura automatizada: todos se validan hoy con scripts de humo manuales en `%TEMP%\opencode\verify-*.mjs`, no con tests versionados.
- Faltan criterios de aceptación para las pantallas mock; se redactarán al abrir sus features.
- No hay criterio de aceptación para seguridad mas allá de CSRF y sesión: falta RBAC, rate limiting y verificación de correo (ver `06-security`).
