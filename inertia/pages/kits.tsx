import { type FormEvent, type KeyboardEvent, useState } from 'react'
import { Link, useRouter } from '@adonisjs/inertia/react'
import Icon from '~/components/icon'

type KitRow = {
  id: number
  nombre: string | null
  codigo: string | null
  insumos: number
  costo: number | null
}

type KitsProps = {
  kits: KitRow[]
  total: number
  page: number
  lastPage: number
  nombre?: string | null
  codigo?: string | null
}

const PER_PAGE = 10

export default function Kits({ kits, total, page, lastPage, nombre, codigo }: KitsProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  const first = (page - 1) * PER_PAGE + 1
  const last = Math.min(page * PER_PAGE, total)

  const windowStart = Math.max(1, page - 2)
  const windowEnd = Math.min(lastPage, windowStart + 4)
  const pages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i)

  /**
   * `Costo` es `real`: trae más precisión que 2 decimales (`6.43921`), así que se
   * redondea para la vista. Las 3 filas de prueba lo traen nulo y muestran `—`
   * en vez de `$0.00`, para no sugerir que el kit vale cero.
   */
  const formatMoney = (value: number | null) => {
    if (value === null || value === undefined) return '—'
    return Number.isFinite(value) ? `$${value.toFixed(2)}` : '—'
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
    router.get({ route: 'kits', qs })
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
        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Icon name="gridFill" size={18} />
          Nuevo kit
        </button>
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
            placeholder="Buscar kit por nombre"
            defaultValue={nombre ?? ''}
          />
        </label>
        <label className="skus-search">
          <Icon name="search" size={16} />
          <input
            type="search"
            name="codigo"
            placeholder="Buscar kit por ID"
            defaultValue={codigo ?? ''}
          />
        </label>
      </form>

      <div className="skus-card">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Nombre kit</th>
              <th>Insumos</th>
              <th>Costo</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {kits.map((kit) => (
              <tr key={kit.id}>
                <td>
                  <div className="sku-name">{kit.nombre}</div>
                  <div className="sku-code">{kit.codigo ? `#${kit.codigo}` : ''}</div>
                </td>
                <td className="sku-cell">{kit.insumos}</td>
                <td className="sku-cell">{formatMoney(kit.costo)}</td>
                <td className="sku-cell sku-cell-view">
                  <button
                    type="button"
                    className="btn btn-icon"
                    aria-label={`Opciones de ${kit.nombre ?? 'kit'}`}
                  >
                    <Icon name="dotsThree" size={18} />
                  </button>
                </td>
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
                route="kits"
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
                <Link key={p} className="page-btn" route="kits" qs={filters({ page: p })}>
                  {p}
                </Link>
              )
            )}
            {page < lastPage ? (
              <Link
                className="page-btn"
                route="kits"
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

      {showModal && (
        <div className="kits-modal-overlay">
          <div className="kits-modal">
            <button
              type="button"
              className="btn btn-icon kits-modal-close"
              aria-label="Cerrar"
              onClick={() => setShowModal(false)}
            >
              <Icon name="close" size={18} />
            </button>
            <h1 className="kits-modal-title">Nuevo Kit de Insumos</h1>
            <p className="kits-modal-subtitle">Completa los campos</p>
            <div className="kits-modal-tabs">
              <span className="kits-modal-tab active">Propiedades</span>
              <span className="kits-modal-tab">Insumos</span>
            </div>
            <div className="kits-modal-fields">
              <label className="kits-field">
                <span>Nombre</span>
                <input type="text" placeholder="p. ej. Kit de insumos" />
              </label>
              <label className="kits-field">
                <span>Descripción</span>
                <input type="text" placeholder="p. ej. Descripción" />
              </label>
              <label className="kits-field">
                <span>ID</span>
                <input type="text" placeholder="p. ej. #KI00000" />
              </label>
            </div>
            <div className="kits-modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" disabled>
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
