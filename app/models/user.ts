import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'

/**
 * Persona con sesión. Es la tabla de la conexión `sqlite` (la default), la misma que usa la
 * magic link: a diferencia del resto de catálogos, `/usuarios` **no** lee Supabase.
 *
 * `area`, `rol` y `superadmin` los añade la migración
 * `1780000000000_add_area_rol_superadmin_to_users_table` para que la pantalla pueda mostrar las
 * 5 columnas de la referencia de diseño. Son **datos de pantalla**: nada en el servidor los lee
 * para autorizar (ver `docs/06-security/roles-permissions.md`).
 */
export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
