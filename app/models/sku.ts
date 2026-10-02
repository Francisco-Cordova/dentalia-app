import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Encabezado del catálogo de SKUs, en el esquema `dev` de Supabase (solo lectura).
 *
 * Sin `static schema`: el `searchPath` de la conexión `supabase` pone `dev` primero
 * (ver config/database.ts). Ojo: `public."SKU"` existe con las mismas 255 filas y los
 * mismos 255 `id`, pero **no es un duplicado exacto**: difieren ~210 filas solo en las
 * columnas de costo y margen (`Costo Nacional og/espcialista`, `Costo Turista *`,
 * `Costo insumos`, `Margen *`, 1 fila en `Costo laboratorio`). Esas columnas no se
 * muestran en la pantalla, así que hoy la diferencia no se ve; invertir el `searchPath`
 * sí rompería la fuente documentada (BR-SKU-003).
 *
 * Solo se declaran las 4 columnas que la pantalla necesita. Las 21 restantes
 * (precios, comisiones, márgenes, `sesiones`, `"Pasa por lab"`, `"Insumos"`,
 * `created_at`, …) no aparecen en la tabla y no se declaran a propósito, igual que
 * `costo` en zona.ts o `id_modulo` en modulos_salud.ts (BR-SKU-001).
 */
export default class Sku extends BaseModel {
  static connection = 'supabase'

  static table = 'SKU'

  /** `bigint`; disperso entre 8 y 287 (los `id` 1-7 no existen), como en `Kits`. */
  @column({ columnName: 'id', isPrimary: true })
  declare id: number

  /** `text`. Admite `NULL`, aunque hoy las 255 filas traen valor. */
  @column({ columnName: 'Nombre' })
  declare nombre: string

  /** `bigint`, `NOT NULL`, `UNIQUE` (`sku_id_tratamiento_key`). La vista lo muestra como "Tratamiento {n}". */
  @column({ columnName: 'ID tratamiento' })
  declare tratamiento: number

  /**
   * Texto tipo `'2.3'`, no un número: 253 valores distintos en 255 filas (hay 2
   * repetidos), así que no sirve como clave. Admite `NULL` (ninguna fila lo trae).
   */
  @column({ columnName: 'ID SKU' })
  declare codigo: string
}
