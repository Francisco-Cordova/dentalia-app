import { type FormEvent, type KeyboardEvent, useState } from 'react'
import { Link, useRouter } from '@adonisjs/inertia/react'
import Icon from '~/components/icon'

type ZonaRow = {
  id: number
  nombre: string
  clinicas: number
}

type ZonasProps = {
  zonas: ZonaRow[]
  total: number
  page: number
  lastPage: number
  nombre?: string | null
}

const PER_PAGE = 10

export default function Zonas({ zonas, total, page, lastPage, nombre }: ZonasProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  const first = (page - 1) * PER_PAGE + 1
  const last = Math.min(page * PER_PAGE, total)

  const windowStart = Math.max(1, page - 2)
  const windowEnd = Math.min(lastPage, windowStart + 4)
  const pages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i)

  const filters = (extra: Record<string, string | number>) => {
    const qs: Record<string, string | number> = { ...extra }
    if (nombre) qs.nombre = nombre
    return qs
  }

  const search = (form: HTMLFormElement) => {
    const data = new FormData(form)
    const qs: Record<string, string> = {}
    const term = String(data.get('nombre') ?? '').trim()
    if (term) qs.nombre = term
    router.get({ route: 'zonas', qs })
  }

  const handleSearch = (form: FormEvent<HTMLFormElement>) => {
    form.preventDefault()
    search(form.currentTarget)
  }

  /**
   * El form no tiene botón submit, así que el "implicit submission" del navegador
   * al presionar Enter no es fiable: lo manejamos a mano, igual que en insumos y kits.
   */
  const handleKeyDown = (form: KeyboardEvent<HTMLFormElement>) => {
    if (form.key !== 'Enter') return
    form.preventDefault()
    search(form.currentTarget)
  }

  return (
    <div className="skus-page">
      <div className="skus-topbar">
        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Icon name="mapPin" size={18} />
          Nueva zona
        </button>
      </div>

      <form
        className="skus-toolbar insumos-toolbar"
        onSubmit={handleSearch}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      >
        <label className="skus-search">
          <Icon name="search" size={16} />
          <input type="search" name="nombre" placeholder="Buscar..." defaultValue={nombre ?? ''} />
        </label>
      </form>

      <div className="skus-card">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Clínicas</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {zonas.map((zona) => (
              <tr key={zona.id}>
                <td>
                  <div className="sku-name">{zona.nombre}</div>
                  {/*
                    El id va bajo el nombre y SIN prefijo `#`, a diferencia de kits.
                    Aquí no hay código de Odoo: es el `id` numérico de la tabla.
                  */}
                  <div className="sku-code">{zona.id}</div>
                </td>
                <td className="sku-cell">{zona.clinicas}</td>
                <td className="sku-cell sku-cell-view">
                  <button
                    type="button"
                    className="btn btn-icon"
                    aria-label={`Opciones de ${zona.nombre}`}
                  >
                    <Icon name="dotsThree" size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer className="sku-footer">
          <div className="sku-pagination">
            <span>
              {first}-{last} de {total.toLocaleString('en-US')}
            </span>
            {page > 1 ? (
              <Link
                className="page-btn"
                route="zonas"
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
                <Link key={p} className="page-btn" route="zonas" qs={filters({ page: p })}>
                  {p}
                </Link>
              )
            )}
            {page < lastPage ? (
              <Link
                className="page-btn"
                route="zonas"
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
            <h1 className="kits-modal-title">Nueva zona</h1>
            <p className="kits-modal-subtitle">Completa los campos</p>
            <div className="kits-modal-tabs">
              <span className="kits-modal-tab active">Propiedades</span>
              <span className="kits-modal-tab">Clínicas</span>
            </div>
            <div className="kits-modal-fields">
              <label className="kits-field">
                <span>Nombre</span>
                <input type="text" placeholder="p.ej. Pedro Fuentes" />
              </label>
              <label className="kits-field">
                <span>Descripción</span>
                <textarea placeholder="p. ej. Brackets" />
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
