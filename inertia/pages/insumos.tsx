import { type FormEvent, type KeyboardEvent } from 'react'
import { Link, useRouter } from '@adonisjs/inertia/react'
import Icon from '~/components/icon'

type InsumoRow = {
  id: number
  nombre: string
  codigo: string
  categoria: string
  cantidad: string | number
  costo: string | number
}

type InsumosProps = {
  insumos: InsumoRow[]
  total: number
  page: number
  lastPage: number
  nombre?: string | null
  codigo?: string | null
}

const PER_PAGE = 10

export default function Insumos({ insumos, total, page, lastPage, nombre, codigo }: InsumosProps) {
  const router = useRouter()
  const first = (page - 1) * PER_PAGE + 1
  const last = Math.min(page * PER_PAGE, total)

  const windowStart = Math.max(1, page - 2)
  const windowEnd = Math.min(lastPage, windowStart + 4)
  const pages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i)

  const formatMoney = (value: string | number | null) => {
    if (value === null || value === undefined) return ''
    const n = typeof value === 'string' ? Number(value) : value
    return Number.isFinite(n) ? `$${n.toFixed(2)}` : value
  }

  const filters = (extra: Record<string, string | number>) => {
    const qs: Record<string, string | number> = { ...extra }
    if (nombre) qs.nombre = nombre
    if (codigo) qs.codigo = codigo
    return qs
  }

  const search = (form: HTMLFormElement) => {
    const data = new FormData(form)
    const qs: Record<string, string> = {}
    const termNombre = String(data.get('nombre') ?? '').trim()
    const termCodigo = String(data.get('codigo') ?? '').trim()
    if (termNombre) qs.nombre = termNombre
    if (termCodigo) qs.codigo = termCodigo
    router.get({ route: 'insumos', qs })
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    search(event.currentTarget)
  }

  /**
   * Con dos campos de texto y sin botón submit, el navegador NO dispara el
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
        <div className="sku-actions2">
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
          <input type="search" name="codigo" placeholder="Buscar ID" defaultValue={codigo ?? ''} />
        </label>
      </form>

      <div className="skus-card">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoria</th>
              <th>Cantidad</th>
              <th>Costo</th>
            </tr>
          </thead>
          <tbody>
            {insumos.map((insumo) => (
              <tr key={insumo.id}>
                <td>
                  <div className="sku-name">{insumo.nombre}</div>
                  <div className="sku-code">{insumo.codigo}</div>
                </td>
                <td className="sku-cell">{insumo.categoria}</td>
                <td className="sku-cell">{insumo.cantidad}</td>
                <td className="sku-cell">{formatMoney(insumo.costo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer className="sku-footer">
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
                route="insumos"
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
                <Link key={p} className="page-btn" route="insumos" qs={filters({ page: p })}>
                  {p}
                </Link>
              )
            )}
            {page < lastPage ? (
              <Link
                className="page-btn"
                route="insumos"
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
