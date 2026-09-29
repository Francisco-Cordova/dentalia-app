import { useState } from 'react'
import Icon from '~/components/icon'

type KitRow = {
  id: number
  nombre: string
  codigo: string
  insumos: string
  costo: string
}

const kits: KitRow[] = [
  {
    id: 1,
    nombre: 'KIT BASICO POR SESION',
    codigo: '#KI1001',
    insumos: '15',
    costo: '$38.86',
  },
  {
    id: 2,
    nombre: 'KIT DE ANESTESIA ADULTO',
    codigo: '#KI1005',
    insumos: '5',
    costo: '$12.47',
  },
  {
    id: 3,
    nombre: 'KIT DE AISLADO ABSOLUTO',
    codigo: '#KI1004',
    insumos: '6',
    costo: '$5.73',
  },
  {
    id: 4,
    nombre: 'KIT BASICO POR ASISTENTE',
    codigo: '#KI1003',
    insumos: '7',
    costo: '$18.36',
  },
  {
    id: 5,
    nombre: 'KIT DE ANESTESIA NINO',
    codigo: '#KI1006',
    insumos: '5',
    costo: '$6.44',
  },
  {
    id: 6,
    nombre: 'KIT DE CIRUGIA',
    codigo: '#KI1007',
    insumos: '13',
    costo: '$102.41',
  },
  {
    id: 7,
    nombre: 'KIT DE ESTERILIZADO',
    codigo: '#KI1002',
    insumos: '4',
    costo: '$9.84',
  },
  {
    id: 8,
    nombre: 'KIT DE IMPRESION',
    codigo: '#KI1009',
    insumos: '14',
    costo: '$369.65',
  },
  {
    id: 9,
    nombre: 'KIT RADIOGRAFIA PERIAPICAL ADULTO',
    codigo: '#KI1010',
    insumos: '6',
    costo: '$13.25',
  },
  {
    id: 10,
    nombre: 'KIT DE RX PLACA DE FOSFORO',
    codigo: '#KI1012',
    insumos: '3',
    costo: '$6.88',
  },
]

export default function Kits() {
  const [showModal, setShowModal] = useState(false)

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

      <div className="skus-toolbar insumos-toolbar">
        <label className="skus-search">
          <Icon name="search" size={16} />
          <input type="search" placeholder="Buscar kit por nombre" />
        </label>
        <label className="skus-search">
          <Icon name="search" size={16} />
          <input type="search" placeholder="Buscar kit por ID" />
        </label>
      </div>

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
                  <div className="sku-code">{kit.codigo}</div>
                </td>
                <td className="sku-cell">{kit.insumos}</td>
                <td className="sku-cell">{kit.costo}</td>
                <td className="sku-cell sku-cell-view">
                  <button
                    type="button"
                    className="btn btn-icon"
                    aria-label={`Opciones de ${kit.nombre}`}
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
            <span>1-10 de 32</span>
            <button type="button" className="page-btn" aria-label="Página anterior">
              <Icon name="chevronLeft" size={16} />
            </button>
            {[1, 2, 3, 4].map((page) => (
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
