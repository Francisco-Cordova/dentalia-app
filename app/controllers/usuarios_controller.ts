import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

function escapeLike(term: string) {
  return term.replace(/[%_]/g, (char) => `\\${char}`)
}

/**
 * Listado de usuarios, solo lectura.
 *
 * A diferencia de los demás catálogos, esta pantalla **no** lee Supabase: los usuarios son los
 * de la autenticación, que viven en `users` de la conexión `sqlite` (la default). Por eso no
 * se usa `withConnectionRetry()`: ese helper existe porque Supabase cierra conexiones inactivas
 * y la consulta va por red; aquí la base es un archivo local.
 *
 * `password` está en la tabla pero **nunca** se selecciona: el hash scrypt no debe llegar al
 * navegador (ver AC-USR-007).
 *
 * `area`, `rol` y `superadmin` son datos de pantalla (ver BR-USR-005): nada aquí los usa para
 * autorizar. `middleware.auth()` sigue siendo el único control de acceso.
 */
export default class UsuariosController {
  async index({ inertia, request }: HttpContext) {
    const requestedPage = Number(request.input('page', '1'))
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
    const perPage = 10
    const q = String(request.input('q', '') || '').trim()

    const query = User.query()
      .select('id', 'full_name', 'email', 'area', 'rol', 'superadmin')
      .orderBy('id', 'asc')

    if (q) {
      // SQLite no tiene `ilike`: su `LIKE` ya ignora mayúsculas en ASCII, que es lo que
      // necesita esta búsqueda. Se filtra por nombre **o** correo porque el alta por magic
      // link no pide nombre y muchos usuarios lo tienen en NULL (ver BR-USR-003).
      //
      // El `ESCAPE '\'` explícito no es opcional aquí, a diferencia de los catálogos de
      // PostgreSQL: en SQLite el backslash **no** es carácter de escape por defecto. Sin la
      // cláusula, `\%` exige un backslash literal y a la vez `%` sigue siendo comodín, así que el
      // término no encuentra ni las filas que contienen un `%` ni las que casarían por comodín.
      // Medido el 2026-10-01 con `better-sqlite3`: `LIKE '%\%%'` devuelve 0 filas sobre una tabla
      // que sí contiene `50% descuento`, mientras que `LIKE '%\%%' ESCAPE '\'` la devuelve.
      // Si se cambia el filtro, mantener la cláusula: `where(..., 'like', term)` la pierde.
      const term = `%${escapeLike(q)}%`
      query.where((builder) => {
        builder
          .whereRaw("full_name LIKE ? ESCAPE '\\'", [term])
          .orWhereRaw("email LIKE ? ESCAPE '\\'", [term])
      })
    }

    const usuarios = await query.paginate(page, perPage)

    return inertia.render('usuarios', {
      usuarios: usuarios.all().map((usuario) => ({
        id: usuario.id,
        nombre: usuario.fullName,
        correo: usuario.email,
        area: usuario.area,
        rol: usuario.rol,
        superadmin: usuario.superadmin,
      })),
      total: usuarios.total,
      page: usuarios.currentPage,
      lastPage: usuarios.lastPage,
      q: q || null,
    })
  }
}
