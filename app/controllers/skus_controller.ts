import Sku from '#models/sku'
import { withConnectionRetry } from '#services/with_connection_retry'
import type { HttpContext } from '@adonisjs/core/http'

function escapeLike(term: string) {
  return term.replace(/[%_]/g, (char) => `\\${char}`)
}

export default class SkusController {
  async index({ inertia, request }: HttpContext) {
    const requestedPage = Number(request.input('page', '1'))
    /**
     * Sin este filtro, `?page=0`, `?page=-2` y `?page=` (vacío) llegan a knex como offset
     * negativo o `NaN` y knex lanza ("A non-negative integer must be provided to offset"),
     * es decir un 500 por URL escrita a mano. Un entero positivo es lo único válido.
     */
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
    const perPage = 10
    const nombre = String(request.input('nombre', '') || '').trim()
    const tratamiento = String(request.input('tratamiento', '') || '').trim()
    const codigo = String(request.input('codigo', '') || '').trim()

    const query = Sku.query()
      .select('id', 'Nombre', 'ID tratamiento', 'ID SKU')
      .orderBy('id', 'asc')

    if (nombre) {
      query.where('Nombre', 'ilike', `%${escapeLike(nombre)}%`)
    }
    if (tratamiento) {
      /**
       * `"ID tratamiento"` es `bigint` y PostgreSQL **no** castea bigint a text de forma
       * implícita, así que un `ILIKE` directo daría error de tipos. El cast a texto es lo
       * que habilita la coincidencia parcial: escribir `500` encuentra el `5004`
       * (BR-SKU-002).
       */
      query.whereRaw('"ID tratamiento"::text ILIKE ?', [`%${escapeLike(tratamiento)}%`])
    }
    if (codigo) {
      /** Ya es texto tipo `'2.3'`, así que aquí sí basta el `ILIKE`. */
      query.where('ID SKU', 'ilike', `%${escapeLike(codigo)}%`)
    }

    const skus = await withConnectionRetry(() => query.paginate(page, perPage))

    return inertia.render('skus', {
      skus: skus.all().map((sku) => ({
        /**
         * `pg` devuelve los `bigint` como texto, así que `"id"` y `"ID tratamiento"` llegan
         * como string aunque el modelo los declare numéricos. Se castean aquí para que las
         * props respeten su tipo; `"ID tratamiento"` va a `String` porque su único uso es
         * mostrarlo en el subtexto, y los valores caben sin pérdida en `Number`.
         */
        id: Number(sku.id),
        nombre: sku.nombre,
        tratamiento: String(sku.tratamiento),
        codigo: sku.codigo,
      })),
      total: skus.total,
      page: skus.currentPage,
      lastPage: skus.lastPage,
      nombre: nombre || null,
      tratamiento: tratamiento || null,
      codigo: codigo || null,
    })
  }
}
