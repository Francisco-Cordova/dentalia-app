import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Encabezado del catálogo de kits, en el esquema `dev` de Supabase (solo lectura).
 *
 * Sin `static schema`: el `searchPath` de la conexión `supabase` pone `dev` primero
 * (ver config/database.ts). Ojo: `public."Kits"` existe y tiene las mismas columnas
 * base, pero además `id_kit`, `id_insumo` y `Cantidad requerida numero`; es la
 * tabla desnormalizada de detalle, no un duplicado. Invertir el `searchPath`
 * cambiaría el total y el conteo de insumos.
 *
 * `"Insumos"` NO es un número: es una lista de códigos de insumo separados por
 * coma, con espaciado alrededor ("A , B" o "A, B"). El conteo que muestra la
 * tabla lo calcula el controller recortando cada token.
 */
export default class Kit extends BaseModel {
  static connection = 'supabase'

  static table = 'Kits'

  @column({ columnName: 'id', isPrimary: true })
  declare id: number

  @column({ columnName: 'Nombre' })
  declare nombre: string | null

  /** Código de Odoo, sin el prefijo `#` que muestra la vista. */
  @column({ columnName: 'ID_odoo' })
  declare codigo: string | null

  /** `real` con más precisión que 2 decimales; 3 filas de prueba lo traen nulo. */
  @column({ columnName: 'Costo' })
  declare costo: number | null

  @column({ columnName: 'Descripcion' })
  declare descripcion: string | null

  /** Lista de `DEFAULT_CODE` separados por coma. Nulo o vacío en 3 filas. */
  @column({ columnName: 'Insumos' })
  declare insumosRaw: string | null

  @column({ columnName: 'created_at' })
  declare createdAt: Date
}
