import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Catálogo de zonas, en el esquema `dev` de Supabase (solo lectura).
 *
 * A diferencia de `dev."Insumos"` y `dev."Kits"`, aquí la tabla y las columnas van
 * en minúsculas (`zonas`, `nombre`, `descripcion`).
 *
 * Sin `static schema`: el `searchPath` de la conexión `supabase` pone `dev` primero
 * (ver config/database.ts). Ojo: `public."zonas"` **sí** es un duplicado — mismas
 * columnas y mismas 2 filas, verificado con `EXCEPT` en ambos sentidos. No aporta
 * nada que `dev` no tenga, a diferencia de `public."Kits"`, que es tabla de detalle.
 *
 * La columna `costo` existe (es `real`) pero **no se declara aquí a propósito**: las 2
 * filas la traen en `NULL` y la columna no aparece en la pantalla de zonas, ni en el
 * HTML de referencia. No es un descuido; si algún día se muestra, se agrega junto con
 * el formato de moneda.
 *
 * La columna "Clínicas" de la tabla no está en esta tabla: sale de contar las filas de
 * `public.clinicas_zonas` con el mismo `zona_id`. Lo calcula el controller.
 */
export default class Zona extends BaseModel {
  static connection = 'supabase'

  static table = 'zonas'

  @column({ columnName: 'id', isPrimary: true })
  declare id: number

  @column({ columnName: 'nombre' })
  declare nombre: string

  @column({ columnName: 'descripcion' })
  declare descripcion: string | null

  @column({ columnName: 'created_at' })
  declare createdAt: Date
}
