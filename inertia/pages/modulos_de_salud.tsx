import { useState } from 'react'
import Icon from '~/components/icon'

type ModuloRow = {
  id: number
  nombre: string
  descripcion?: string
  opciones: string
}

const modulos: ModuloRow[] = [
  { id: 1, nombre: 'Versión 1', opciones: '16' },
  { id: 2, nombre: 'Versión 2', descripcion: 'Lorem ipsum', opciones: '4' },
  { id: 3, nombre: 'Version 3', descripcion: 'Prueba', opciones: '2' },
  { id: 4, nombre: 'Versión 4', descripcion: 'Test', opciones: '4' },
  { id: 5, nombre: 'Capacitacion 5', descripcion: 'Prueba', opciones: '0' },
  { id: 6, nombre: 'Modulo test', descripcion: 'Este es un modulo de test', opciones: '0' },
]

export default function ModulosDeSalud() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="skus-page">
      <div className="skus-topbar">
        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Icon name="userPlus" size={18} />
          Nuevo módulo de salud
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
              <th>SKU</th>
              <th>Opciones</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {modulos.map((modulo) => (
              <tr key={modulo.id}>
                <td>
                  <div className="sku-name">{modulo.nombre}</div>
                  {modulo.descripcion && <div className="sku-code">{modulo.descripcion}</div>}
                </td>
                <td className="sku-cell" />
                <td className="sku-cell">{modulo.opciones}</td>
                <td className="sku-cell sku-cell-view">
                  <button
                    type="button"
                    className="btn btn-icon"
                    aria-label={`Eliminar ${modulo.nombre}`}
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
              <span>1-6 de 6</span>
              <button type="button" className="page-btn" aria-label="Página anterior">
                <Icon name="chevronLeft" size={16} />
              </button>
              <button type="button" className="page-btn active">
                1
              </button>
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
