import { useState } from 'react'
import Icon from '~/components/icon'

type UsuarioRow = {
  id: number
  nombre: string
  correo: string
  area: string
  rol: string
}

const usuarios: UsuarioRow[] = [
  {
    id: 1,
    nombre: 'User_TO',
    correo: 'user_to@konfront.mx',
    area: 'TO',
    rol: 'Validador, Editar',
  },
  {
    id: 2,
    nombre: 'Francisco Córdova',
    correo: 'francisco.cordova@konfront.mx',
    area: 'TO',
    rol: 'Ver',
  },
  {
    id: 3,
    nombre: 'Pablo escalante',
    correo: 'pablo.escalante@konfront.mx',
    area: 'Dental',
    rol: 'Validador',
  },
  {
    id: 4,
    nombre: 'etienne',
    correo: 'etienne.ayala@konfront.mx',
    area: 'Dental',
    rol: 'Editar',
  },
  {
    id: 5,
    nombre: 'Cristina Muñoz',
    correo: 'cristina.munoz@konfront.mx',
    area: 'Dental',
    rol: 'Validador',
  },
  {
    id: 6,
    nombre: 'Paty Moreno',
    correo: 'patricia.moreno@konfront.mx',
    area: 'Planeación financiera',
    rol: 'Validador',
  },
  {
    id: 7,
    nombre: 'Fer Saenz',
    correo: 'fernando.saenz@konfront.mx',
    area: 'Dental',
    rol: 'Validador',
  },
  {
    id: 8,
    nombre: 'Karen Arellano',
    correo: 'karen.arellano@konfront.mx',
    area: 'Dental',
    rol: 'Validador, Editar',
  },
  {
    id: 9,
    nombre: 'Carlos Mendoza',
    correo: 'carlos.mendoza@konfront.mx',
    area: 'Planeación financiera',
    rol: 'Editar',
  },
  {
    id: 10,
    nombre: 'Fer Pedro',
    correo: '123@gmail.com',
    area: 'Dental',
    rol: 'Ver',
  },
]

export default function Usuarios() {
  const [openMenu, setOpenMenu] = useState<number | null>(null)

  return (
    <div className="skus-page">
      {openMenu !== null && (
        <div className="sku-dropdown-backdrop" onClick={() => setOpenMenu(null)} />
      )}

      <div className="skus-topbar">
        <button type="button" className="btn btn-primary">
          <Icon name="userPlus" size={18} />
          Nuevo usuario
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
              <th>Correo</th>
              <th>Area</th>
              <th>Rol</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>
                  <div className="sku-name">{usuario.nombre}</div>
                </td>
                <td className="sku-cell">{usuario.correo}</td>
                <td className="sku-cell">{usuario.area}</td>
                <td className="sku-cell">{usuario.rol}</td>
                <td className="sku-cell sku-cell-view">
                  <div className="sku-row-menu">
                    <button
                      type="button"
                      className="btn btn-icon"
                      aria-label={`Opciones de ${usuario.nombre}`}
                      onClick={() =>
                        setOpenMenu((current) => (current === usuario.id ? null : usuario.id))
                      }
                    >
                      <Icon name="dotsThree" size={18} />
                    </button>
                    {openMenu === usuario.id && (
                      <div className="sku-row-dropdown">
                        <button type="button" className="sku-dropdown-item">
                          <Icon name="pencil" size={16} />
                          Editar usuario
                        </button>
                        <button type="button" className="sku-dropdown-item danger">
                          <Icon name="trash" size={16} />
                          Eliminar usuario
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer className="sku-footer">
          <div className="sku-actions2">
            <div className="sku-pagination">
              <span>1-10 de 20</span>
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
    </div>
  )
}
