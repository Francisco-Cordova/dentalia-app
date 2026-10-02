import { type FormEvent, type KeyboardEvent } from 'react'
import { Link, useRouter } from '@adonisjs/inertia/react'
import Icon from '~/components/icon'

type SkuRow = {
  id: number
  nombre: string
  tratamiento: string
  codigo: string
}

type SkusProps = {
  skus: SkuRow[]
  total: number
  page: number
  lastPage: number
  nombre?: string | null
  tratamiento?: string | null
  codigo?: string | null
}

const PER_PAGE = 10

/**
 * DATOS DUMMY, no reales: 5 de las 7 columnas de esta pantalla no son derivables de
 * `dev."SKU"` (BR-SKU-001). Ninguna columna de la tabla corresponde a "Tipo", "Estatus",
 * "Familia", "Especialidad" ni "Módulo de salud", y las tablas que podrían dar esos datos
 * están vacías o sin relación: `public.familias` y `public.especialidades` tienen 0 filas, y
 * `SKU` no tiene ninguna FK hacia `dev.modulos_salud`.
 *
 * Se declaran aquí como constantes, con el mismo criterio que `SKUS_DUMMY` de
 * FEATURE-008: que la columna se vea completa sin reportar un dato inventado como real.
 * Cuando existan las relaciones, estas constantes desaparecen y los valores pasan a
 * venir del controller.
 */
const TIPO_DUMMY = 'Tratamiento'
const ESTATUS_DUMMY = { texto: 'Activo', icono: 'check', clase: 'pill pill-success' } as const
const SIN_DATO_DUMMY = '—'

export default function Skus({
  skus,
  total,
  page,
  lastPage,
  nombre,
  tratamiento,
  codigo,
}: SkusProps) {
  const router = useRouter()
  const first = (page - 1) * PER_PAGE + 1
  const last = Math.min(page * PER_PAGE, total)

  const windowStart = Math.max(1, page - 2)
  const windowEnd = Math.min(lastPage, windowStart + 4)
  const pages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i)

  const filters = (extra: Record<string, string | number>) => {
    const qs: Record<string, string | number> = { ...extra }
    if (nombre) qs.nombre = nombre
    if (tratamiento) qs.tratamiento = tratamiento
    if (codigo) qs.codigo = codigo
    return qs
  }

  const search = (form: HTMLFormElement) => {
    const data = new FormData(form)
    const qs: Record<string, string> = {}
    const termNombre = String(data.get('nombre') ?? '').trim()
    const termTratamiento = String(data.get('tratamiento') ?? '').trim()
    const termCodigo = String(data.get('codigo') ?? '').trim()
    if (termNombre) qs.nombre = termNombre
    if (termTratamiento) qs.tratamiento = termTratamiento
    if (termCodigo) qs.codigo = termCodigo
    router.get({ route: 'skus', qs })
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    search(event.currentTarget)
  }

  /**
   * Con tres campos de texto y sin botón submit, el navegador NO dispara el
   * "implicit submission" al presionar Enter, así que lo manejamos a mano.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    search(event.currentTarget)
  }

  return (
    <div className="skus-page">
      <div className="skus-topbar">
        <button type="button" className="btn btn-primary">
          <Icon name="plusLg" size={18} />
          Nuevo SKU
        </button>
        <div className="sku-actions2">
          <button type="button" className="btn btn-outline">
            <Icon name="pencil" size={18} />
            Edición masiva
          </button>
          <button type="button" className="btn btn-outline">
            <Icon name="arrowsDownUp" size={18} />
            Ordenar
          </button>
        </div>
      </div>

      <form
        className="skus-toolbar insumos-toolbar"
        onSubmit={handleSearch}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      >
        <label className="skus-search">
          <Icon name="search" size={16} />
          <input
            type="search"
            name="nombre"
            placeholder="Buscar Nombre"
            defaultValue={nombre ?? ''}
          />
        </label>
        <label className="skus-search">
          <Icon name="search" size={16} />
          <input
            type="search"
            name="tratamiento"
            placeholder="Buscar ID de tratamiento"
            defaultValue={tratamiento ?? ''}
          />
        </label>
        <label className="skus-search">
          <Icon name="search" size={16} />
          <input
            type="search"
            name="codigo"
            placeholder="Buscar ID SKU"
            defaultValue={codigo ?? ''}
          />
        </label>
      </form>

      <div className="skus-card">
        {/*
          Las 7 columnas son las de la maqueta (no hay HTML de referencia: el sitio cambió
          de estructura). Solo "Nombre" (+ el subtexto con los dos IDs) tiene dato real; las
          4 celdas siguientes son los dummies declarados arriba.
        */}
        <table className="sku-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Estatus</th>
              <th>Familia</th>
              <th>Módulo de salud</th>
              <th>Especialidad</th>
              <th aria-label="Ver" />
            </tr>
          </thead>
          <tbody>
            {skus.map((sku) => (
              <tr key={sku.id}>
                <td>
                  <div className="sku-name">{sku.nombre}</div>
                  <div className="sku-code">
                    Tratamiento {sku.tratamiento} · SKU {sku.codigo}
                  </div>
                </td>
                <td className="sku-cell">{TIPO_DUMMY}</td>
                <td className="sku-cell">
                  <span className={ESTATUS_DUMMY.clase}>
                    <Icon name={ESTATUS_DUMMY.icono} size={14} />
                    {ESTATUS_DUMMY.texto}
                  </span>
                </td>
                <td className="sku-cell">{SIN_DATO_DUMMY}</td>
                <td className="sku-cell">{SIN_DATO_DUMMY}</td>
                <td className="sku-cell">{SIN_DATO_DUMMY}</td>
                <td className="sku-cell sku-cell-view">
                  {/* Maqueta: no hay ruta de detalle de SKU, así que el botón no hace nada. */}
                  <button type="button" className="btn btn-icon" aria-label={`Ver ${sku.nombre}`}>
                    <Icon name="externalLink" size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer className="sku-footer">
          {/* La fecha es dummy: `created_at` existe en la tabla pero no se muestra (decisión del usuario). */}
          <span className="sku-updated">
            <button type="button" className="btn btn-icon" aria-label="Actualizar">
              <Icon name="refreshCcw" size={16} />
            </button>
            Ultima actualización 14/07 10:59
          </span>
          <div className="sku-pagination">
            <span>
              {first}-{last} de {total.toLocaleString('en-US')}
            </span>
            {page > 1 ? (
              <Link
                className="page-btn"
                route="skus"
                qs={filters({ page: page - 1 })}
                aria-label="Página anterior"
              >
                <Icon name="chevronLeft" size={16} />
              </Link>
            ) : (
              <button type="button" className="page-btn" aria-label="Página anterior" disabled>
                <Icon name="chevronLeft" size={16} />
              </button>
            )}
            {pages.map((p) =>
              p === page ? (
                <button key={p} type="button" className="page-btn active">
                  {p}
                </button>
              ) : (
                <Link key={p} className="page-btn" route="skus" qs={filters({ page: p })}>
                  {p}
                </Link>
              )
            )}
            {page < lastPage ? (
              <Link
                className="page-btn"
                route="skus"
                qs={filters({ page: page + 1 })}
                aria-label="Página siguiente"
              >
                <Icon name="chevronRight" size={16} />
              </Link>
            ) : (
              <button type="button" className="page-btn" aria-label="Página siguiente" disabled>
                <Icon name="chevronRight" size={16} />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
