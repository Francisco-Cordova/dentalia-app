import { useState } from 'react'
import Icon from '~/components/icon'

type ZonaRow = {
  id: number
  nombre: string
  subtitulo?: string
  clinicas: string
}

const zonas: ZonaRow[] = [
  {
    id: 1,
    nombre: 'Nacional',
    subtitulo: '2',
    clinicas: '6',
  },
  {
    id: 2,
    nombre: 'Turista',
    subtitulo: '1',
    clinicas: '7',
  },
  {
    id: 3,
    nombre: 'Zona test',
    clinicas: '2',
  },
  {
    id: 4,
    nombre: 'Zona Periferico Sur',
    clinicas: '2',
  },
  {
    id: 5,
    nombre: 'Zona 23 Abril',
    clinicas: '1',
  },
  {
    id: 6,
    nombre: 'Zona Capacitacion',
    clinicas: '3',
  },
  {
    id: 7,
    nombre: 'Konfront 1',
    clinicas: '1',
  },
]

export default function Zonas() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="skus-page">
      <div className="skus-topbar">
        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Icon name="mapPin" size={18} />
          Nueva zona
        </button>
      </div>

      <div className="skus-toolbar insumos-toolbar">
        <label className="skus-search">
          <Icon name="search" size={16} />
          <input type="search" placeholder="Buscar..." />
        </label>
      </div>

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
                  {zona.subtitulo && <div className="sku-code">{zona.subtitulo}</div>}
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
          <div className="sku-actions2">
            <div className="sku-pagination">
              <span>1-10 de 7</span>
              <button type="button" className="page-btn" aria-label="Página anterior">
                <Icon name="chevronLeft" size={16} />
              </button>
              {[1, 2].map((page) => (
                <button
                  key={page}
                  type="button"
                  className={page === 1 ? 'page-btn active' : 'page-btn'}
                >
                  {page}
                </button>
              ))}
              <button type="button" className="page-btn" aria-label="Página siguiente">
                <Icon name="chevronRight" size={16} />
              </button>
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
