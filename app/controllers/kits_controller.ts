import Kit from '#models/kit'
import { withConnectionRetry } from '#services/with_connection_retry'
import type { HttpContext } from '@adonisjs/core/http'

function escapeLike(term: string) {
  return term.replace(/[%_]/g, (char) => `\\${char}`)
}

/**
 * `"Insumos"` es una lista de códigos separados por coma, no un número:
 * `"M2625 , M1711"` o `"O0107, I0878"`.
 *
 * El recorte no cambia el resultado con las 40 filas actuales (verificado: los
 * espacios van pegados al token, nunca hay un token vacío), pero evita contar de
 * más si Odoo llegara a escribir una coma final o una doble coma. Con `null` o
 * vacío devuelve 0, no `NaN`.
 */
function countInsumos(raw: string | null) {
  if (!raw) return 0
  return raw
    .split(',')
    .map((code) => code.trim())
    .filter((code) => code.length > 0).length
}

export default class KitsController {
  async index({ inertia, request }: HttpContext) {
    const requestedPage = Number(request.input('page', '1'))
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
    const perPage = 10
    const nombre = String(request.input('nombre', '') || '').trim()
    const codigo = String(request.input('codigo', '') || '').trim()

    const query = Kit.query()
      .select('id', 'Nombre', 'ID_odoo', 'Costo', 'Insumos')
      .orderBy('id', 'asc')

    if (nombre) {
      query.where('Nombre', 'ilike', `%${escapeLike(nombre)}%`)
    }
    if (codigo) {
      query.where('ID_odoo', 'ilike', `%${escapeLike(codigo)}%`)
    }

    const kits = await withConnectionRetry(() => query.paginate(page, perPage))

    return inertia.render('kits', {
      kits: kits.all().map((kit) => ({
        id: kit.id,
        nombre: kit.nombre,
        codigo: kit.codigo,
        insumos: countInsumos(kit.insumosRaw),
        costo: kit.costo,
      })),
      total: kits.total,
      page: kits.currentPage,
      lastPage: kits.lastPage,
      nombre: nombre || null,
      codigo: codigo || null,
    })
  }
}
