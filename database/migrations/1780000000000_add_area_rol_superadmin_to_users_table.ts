import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Añade a `users` las columnas que el catálogo de usuarios necesita y que la tabla
 * no tenía: `area` y `rol` (texto libre, como en la plantilla de referencia) y
 * `superadmin` (booleano, que en la referencia es una columna separada del rol).
 *
 * Solo afecta a la conexión `sqlite` (la default), que es la que usa la
 * autenticación. El catálogo de Supabase no tiene tabla de usuarios.
 *
 * `down()` pierde los valores de estas tres columnas: no hay forma de reconstruir
 * un `area` o un `rol` que solo vivía aquí.
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('area').nullable()
      table.string('rol').nullable()
      table.boolean('superadmin').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('area')
      table.dropColumn('rol')
      table.dropColumn('superadmin')
    })
  }
}
