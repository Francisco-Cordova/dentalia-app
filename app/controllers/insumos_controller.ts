import Insumo from '#models/insumo'
import type { HttpContext } from '@adonisjs/core/http'

function escapeLike(term: string) {
  return term.replace(/[%_]/g, (char) => `\\${char}`)
}

export default class InsumosController {
  async index({ inertia, request }: HttpContext) {
    const page = Number(request.input('page', '1'))
    const perPage = 10
    const nombre = String(request.input('nombre', '') || '').trim()
    const codigo = String(request.input('codigo', '') || '').trim()

    const query = Insumo.query()
      .select('ID', 'NAME', 'DEFAULT_CODE', 'MARCA', 'CANTIDAD', 'UNIT_COST')
      .orderBy('ID', 'asc')

    if (nombre) {
      query.where('NAME', 'ilike', `%${escapeLike(nombre)}%`)
    }
    if (codigo) {
      query.where('DEFAULT_CODE', 'ilike', `%${escapeLike(codigo)}%`)
    }

    const insumos = await query.paginate(page, perPage)

    return inertia.render('insumos', {
      insumos: insumos.all(),
      total: insumos.total,
      page: insumos.currentPage,
      lastPage: insumos.lastPage,
      nombre: nombre || null,
      codigo: codigo || null,
    })
  }
}
