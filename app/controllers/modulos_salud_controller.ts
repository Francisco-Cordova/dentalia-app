import ModuloSalud from '#models/modulos_salud'
import { withConnectionRetry } from '#services/with_connection_retry'
import type { HttpContext } from '@adonisjs/core/http'

function escapeLike(term: string) {
  return term.replace(/[%_]/g, (char) => `\\${char}`)
}

/**
 * Listado de `dev.modulos_salud`, solo lectura.
 *
 * A diferencia de insumos y kits, aquí no hay ninguna columna con el dato de la columna
 * "SKU" de la pantalla: `public."SKU"` no tiene columna ni FK hacia un módulo, así que
 * no hay forma de contar los SKUs de cada módulo (ver BR-MSD-002). La pantalla pinta 0
 * en esa columna con un dummy declarado en el frontend, no aquí.
 *
 * `id_modulo` y `updated_at` tampoco se usan: no aparecen en la pantalla.
 */
export default class ModulosSaludController {
  async index({ inertia, request }: HttpContext) {
    const requestedPage = Number(request.input('page', '1'))
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
    const perPage = 10
    const nombre = String(request.input('nombre', '') || '').trim()

    const query = ModuloSalud.query().select('id', 'nombre', 'descripcion').orderBy('id', 'asc')

    if (nombre) {
      query.where('nombre', 'ilike', `%${escapeLike(nombre)}%`)
    }

    const modulos = await withConnectionRetry(() => query.paginate(page, perPage))

    return inertia.render('modulos_de_salud', {
      modulos: modulos.all().map((modulo) => ({
        id: modulo.id,
        nombre: modulo.nombre,
        descripcion: modulo.descripcion,
      })),
      total: modulos.total,
      page: modulos.currentPage,
      lastPage: modulos.lastPage,
      nombre: nombre || null,
    })
  }
}
