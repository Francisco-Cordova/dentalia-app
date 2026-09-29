import { useState } from 'react'
import Icon from '~/components/icon'

type FamiliaRow = {
  id: number
  nombre: string
  especialidad: string
}

const familias: FamiliaRow[] = [
  { id: 1, nombre: 'Familia test', especialidad: 'Opcion 1' },
  { id: 2, nombre: 'Familia V3', especialidad: 'Opcion 1' },
  { id: 3, nombre: 'Familia Lorem', especialidad: 'Opcion 2' },
  { id: 4, nombre: 'ALARGAMIENTO DE CORONA', especialidad: '1' },
  { id: 5, nombre: 'CARILLA', especialidad: '8' },
  { id: 6, nombre: 'APICECTOMIA', especialidad: '4' },
  { id: 7, nombre: 'BLANQUEAMIENTO', especialidad: '6' },
  { id: 8, nombre: 'BLANQUEAMIENTO INTERNO', especialidad: '7' },
  { id: 9, nombre: 'APEXIFICACION', especialidad: '3' },
  { id: 10, nombre: 'APARATO DE ORTODONCIA U ORTOPEDIA', especialidad: '2' },
]

export default function Familias() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="skus-page">
      <div className="skus-topbar">
        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Icon name="plusLg" size={18} />
          Nueva familia
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
              <th>Especialidad</th>
              <th>Costo</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {familias.map((familia) => (
              <tr key={familia.id}>
                <td>
                  <div className="sku-name">{familia.nombre}</div>
                </td>
                <td className="sku-cell">{familia.especialidad}</td>
                <td className="sku-cell" />
                <td className="sku-cell sku-cell-view">
                  <button
                    type="button"
                    className="btn btn-icon"
                    aria-label={`Opciones de ${familia.nombre}`}
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
              <span>1-10 de 58</span>
              <button type="button" className="page-btn" aria-label="Página anterior">
                <Icon name="chevronLeft" size={16} />
              </button>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((page) => (
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
            <h1 className="kits-modal-title">Nuevo familia</h1>
            <p className="kits-modal-subtitle">Completa los campos</p>
            <div className="kits-modal-fields">
              <label className="kits-field">
                <span>Nombre</span>
                <input type="text" placeholder="p.ej. Pedro Fuentes" />
              </label>
              <label className="kits-field">
                <span>Descripción</span>
                <textarea placeholder="p. ej. Brackets" />
              </label>
              <label className="kits-field">
                <span>Especialidad</span>
                <select defaultValue="">
                  <option value="" disabled>
                    Seleccionar
                  </option>
                  <option value="opcion-1">Opcion 1</option>
                  <option value="opcion-2">Opcion 2</option>
                  <option value="opcion-3">Opcion 3</option>
                </select>
              </label>
            </div>
            <div className="kits-modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" disabled>
                Crear familia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
