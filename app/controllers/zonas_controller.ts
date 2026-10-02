import Zona from '#models/zona'
import { withConnectionRetry } from '#services/with_connection_retry'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'

function escapeLike(term: string) {
  return term.replace(/[%_]/g, (char) => `\\${char}`)
}

/**
 * La columna "Clínicas" no está en `dev."zonas"`: sale de contar las filas de
 * `public.clinicas_zonas` con el mismo `zona_id`.
 *
 * Se hace con una **subconsulta correlacionada** en el `select` y no con
 * `join` + `groupBy` a propósito: `paginate()` arma su total con
 * `clone().clearSelect().count('* as total')`, así que con un `join` el conteo
 * contaría filas de la unión (clinicas × zonas) y no zonas. La subconsulta vive
 * en el `select`, que `clearSelect()` quita para el conteo, así que `total`
 * sigue siendo el número de zonas.
 *
 * El `RawBuilder` se crea desde la conexión `supabase` para que el SQL crudo
 * viaje con el cliente correcto al transformarlo (ver `transformRaw` en
 * `@adonisjs/lucid/build/src/database/query_builder/chainable.js`).
 */
const CLINICAS_POR_ZONA =
  '(select count(*)::int from public.clinicas_zonas cz where cz.zona_id = "zonas"."id") as clinicas'

export default class ZonasController {
  async index({ inertia, request }: HttpContext) {
    const requestedPage = Number(request.input('page', '1'))
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
    const perPage = 10
    const nombre = String(request.input('nombre', '') || '').trim()

    const query = Zona.query()
      .select('id', 'nombre')
      .select(db.connection('supabase').raw(CLINICAS_POR_ZONA))
      .orderBy('id', 'asc')

    if (nombre) {
      query.where('nombre', 'ilike', `%${escapeLike(nombre)}%`)
    }

    const zonas = await withConnectionRetry(() => query.paginate(page, perPage))

    return inertia.render('zonas', {
      zonas: zonas.all().map((zona) => ({
        id: zona.id,
        nombre: zona.nombre,
        clinicas: Number(zona.$extras.clinicas ?? 0),
      })),
      total: zonas.total,
      page: zonas.currentPage,
      lastPage: zonas.lastPage,
      nombre: nombre || null,
    })
  }
}
