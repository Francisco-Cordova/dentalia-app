import { type FormEvent, type KeyboardEvent, useState } from 'react'
import { Link, useRouter } from '@adonisjs/inertia/react'
import Icon from '~/components/icon'

type ModuloRow = {
  id: number
  nombre: string
  descripcion?: string | null
}

type ModulosProps = {
  modulos: ModuloRow[]
  total: number
  page: number
  lastPage: number
  nombre?: string | null
}

const PER_PAGE = 10

/**
 * DATO DUMMY, no real.
 *
 * El número de SKUs de cada módulo de salud todavía no se puede sacar: `public."SKU"`
 * no tiene ninguna columna ni FK que referencie un módulo, así que no hay forma de
 * contarlos (ver BR-MSD-002). Se pinta 0 en todas las filas a propósito, para que se
 * vea que la columna está pendiente y no reporte un conteo inventado. Cuando exista la
 * relación SKU↔módulo, este `SKUS_DUMMY` desaparece y el valor pasa a venir del
 * controller.
 */
const SKUS_DUMMY = 0

export default function ModulosDeSalud({ modulos, total, page, lastPage, nombre }: ModulosProps) {
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
    router.get({ route: 'modulosDeSalud', qs })
  }

  const handleSearch = (form: FormEvent<HTMLFormElement>) => {
    form.preventDefault()
    search(form.currentTarget)
  }

  /**
   * El form no tiene botón submit, así que el "implicit submission" del navegador
   * al presionar Enter no es fiable: lo manejamos a mano, igual que en insumos, kits y zonas.
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
          <Icon name="userPlus" size={18} />
          Nuevo módulo de salud
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
          {/*
            Las 3 columnas son las del HTML de referencia (`Plantillas/modulos de salud/`):
            el número de SKUs va bajo "SKU" y el botón de acción (trash) bajo "Opciones".
            La maqueta anterior tenía 4 columnas con el número en "Opciones", lo que no
            coincidía con la referencia.
          */}
          <thead>
            <tr>
              <th>Nombre</th>
              <th>SKU</th>
              <th className="sku-cell-view">Opciones</th>
            </tr>
          </thead>
          <tbody>
            {modulos.map((modulo) => (
              <tr key={modulo.id}>
                <td>
                  <div className="sku-name">{modulo.nombre}</div>
                  {modulo.descripcion && <div className="sku-code">{modulo.descripcion}</div>}
                </td>
                <td className="sku-cell">{SKUS_DUMMY}</td>
                <td className="sku-cell sku-cell-view">
                  {/*
                    Maqueta: no hay ruta que borre un módulo de salud, así que el botón
                    no hace nada. El icono trash es el de la referencia.
                  */}
                  <button
                    type="button"
                    className="btn btn-icon"
                    aria-label={`Opciones de ${modulo.nombre}`}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer className="sku-footer">
          <div className="sku-actions2">
            <div className="sku-pagination">
              <span>
                {first}-{last} de {total.toLocaleString('en-US')}
              </span>
              {page > 1 ? (
                <Link
                  className="page-btn"
                  route="modulosDeSalud"
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
                  <Link
                    key={p}
                    className="page-btn"
                    route="modulosDeSalud"
                    qs={filters({ page: p })}
                  >
                    {p}
                  </Link>
                )
              )}
              {page < lastPage ? (
                <Link
                  className="page-btn"
                  route="modulosDeSalud"
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
            <h1 className="kits-modal-title">Nuevo módulo de salud</h1>
            <p className="kits-modal-subtitle">Completa los campos</p>
            <div className="kits-modal-tabs">
              <span className="kits-modal-tab active">Propiedades</span>
            </div>
            <div className="kits-modal-fields">
              <label className="kits-field">
                <span>Nombre</span>
                <input type="text" placeholder="p.ej. Modulo 1" />
              </label>
              <label className="kits-field">
                <span>Descripción</span>
                <textarea placeholder="p. ej. Modulo de ..." />
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
