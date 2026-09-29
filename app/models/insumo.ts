import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Insumo extends BaseModel {
  static connection = 'supabase'

  static table = 'Insumos'

  @column({ columnName: 'ID', isPrimary: true })
  declare id: number

  @column({ columnName: 'NAME' })
  declare nombre: string

  @column({ columnName: 'DEFAULT_CODE' })
  declare codigo: string

  @column({ columnName: 'MARCA' })
  declare categoria: string

  @column({ columnName: 'CANTIDAD' })
  declare cantidad: number

  @column({ columnName: 'UNIT_COST' })
  declare costo: number
}
