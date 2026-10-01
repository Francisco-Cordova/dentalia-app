import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Catálogo de módulos de salud, en el esquema `dev` de Supabase (solo lectura).
 *
 * Igual que `Zona`, la tabla y las columnas van en **minúsculas**
 * (`modulos_salud`, `nombre`, `descripcion`): a diferencia de `dev."Insumos"` y
 * `dev."Kits"`, aquí no hay mayúsculas ni comillas en el nombre.
 *
 * Sin `static schema`: el `searchPath` de la conexión `supabase` pone `dev` primero
 * (ver config/database.ts). Ojo: `public.modulos_salud` **sí** es un duplicado — mismas
 * 6 columnas y mismas 10 filas, verificado con `EXCEPT` en ambos sentidos.
 *
 * `id_modulo` (`bigint`, `NOT NULL`) **no se declara a propósito**: no coincide con
 * `id` (la fila `id` 1 trae `id_modulo` 13, la fila `id` 8 trae 1), así que es un
 * identificador de otro origen cuyo significado se desconoce, y no aparece ni en la
 * pantalla ni en el HTML de referencia. `updated_at` tampoco se declara: esta pantalla
 * no tiene columna "Última actualización".
 *
 * La columna "SKU" de la tabla tampoco sale de aquí: no es derivable, porque
 * `public."SKU"` no tiene ninguna columna ni FK que referencie un módulo. Por eso la
 * pantalla muestra 0 en esa columna (ver BR-MSD-002).
 */
export default class ModuloSalud extends BaseModel {
  static connection = 'supabase'

  static table = 'modulos_salud'

  @column({ columnName: 'id', isPrimary: true })
  declare id: number

  @column({ columnName: 'nombre' })
  declare nombre: string

  @column({ columnName: 'descripcion' })
  declare descripcion: string | null

  @column({ columnName: 'created_at' })
  declare createdAt: Date
}
