import { type FormEvent, type KeyboardEvent, useState } from 'react'
import { useRouter } from '@adonisjs/inertia/react'
import Icon from '~/components/icon'

type UsuarioRow = {
  id: number
  nombre?: string | null
  correo: string
  area?: string | null
  rol?: string | null
  superadmin: boolean
}

type UsuariosProps = {
  usuarios: UsuarioRow[]
  total: number
  page: number
  lastPage: number
  q?: string | null
}

const PER_PAGE = 10

/**
 * `area`, `rol` y `superadmin` son datos de pantalla: nada en el servidor los lee para
 * autorizar (ver BR-USR-004). Existen porque la referencia de diseño los muestra.
 */
function celda(valor?: string | null) {
  return valor ? valor : '—'
}

export default function Usuarios({ usuarios, total, page, lastPage, q }: UsuariosProps) {
  const router = useRouter()
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)

  const first = (page - 1) * PER_PAGE + 1
  const last = Math.min(page * PER_PAGE, total)

  const windowStart = Math.max(1, page - 2)
  const windowEnd = Math.min(lastPage, windowStart + 4)
  const pages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i)

  const filters = (extra: Record<string, string | number>) => {
    const qs: Record<string, string | number> = { ...extra }
    if (q) qs.q = q
    return qs
  }

  const search = (form: HTMLFormElement) => {
    const data = new FormData(form)
    const qs: Record<string, string> = {}
    const term = String(data.get('q') ?? '').trim()
    if (term) qs.q = term
    router.get({ route: 'usuarios', qs })
  }

  const handleSearch = (form: FormEvent<HTMLFormElement>) => {
    form.preventDefault()
    search(form.currentTarget)
  }

  /**
   * El form no tiene botón submit, así que el "implicit submission" del navegador
   * al presionar Enter no es fiable: lo manejamos a mano, igual que en los demás catálogos.
   */
  const handleKeyDown = (form: KeyboardEvent<HTMLFormElement>) => {
    if (form.key !== 'Enter') return
    form.preventDefault()
    search(form.currentTarget)
  }

  return (
    <div className="skus-page">
      {openMenu !== null && (
        <div className="sku-dropdown-backdrop" onClick={() => setOpenMenu(null)} />
      )}

      <div className="skus-topbar">
        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Icon name="userPlus" size={18} />
          Nuevo usuario
        </button>
      </div>

      <div className="skus-toolbar insumos-toolbar">
        <form className="skus-search" onSubmit={handleSearch} onKeyDown={handleKeyDown}>
          <Icon name="search" size={16} />
          <input type="search" name="q" placeholder="Buscar..." defaultValue={q ?? ''} />
        </form>
      </div>

      <div className="skus-card">
        {/*
          Las 5 columnas son las de `Plantillas/usuarios/`. La referencia trae una sexta
          cabecera, "Costo", pero viene vacía en las 10 filas: es residuo de la plantilla de
          kits, así que no se replica (ver FEATURE-006).
        */}
        <table className="sku-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Area</th>
              <th>Rol</th>
              <th>Superadmin</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>
                  <div className="sku-name">{celda(usuario.nombre)}</div>
                </td>
                <td className="sku-cell">{usuario.correo}</td>
                <td className="sku-cell">{celda(usuario.area)}</td>
                <td className="sku-cell">{celda(usuario.rol)}</td>
                <td className="sku-cell">{usuario.superadmin ? 'Sí' : 'No'}</td>
                <td className="sku-cell sku-cell-view">
                  {/*
                    Maqueta: no hay ruta que edite ni borre usuarios, así que el menú no
                    hace nada. Se conserva el `···` de la maqueta con sus dos acciones.
                  */}
                  <div className="sku-row-menu">
                    <button
                      type="button"
                      className="btn btn-icon"
                      aria-label={`Opciones de ${usuario.correo}`}
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
              <span>
                {first}-{last} de {total.toLocaleString('en-US')}
              </span>
              <button
                type="button"
                className="page-btn"
                aria-label="Página anterior"
                disabled={page <= 1}
                onClick={() => router.get({ route: 'usuarios', qs: filters({ page: page - 1 }) })}
              >
                <Icon name="chevronLeft" size={16} />
              </button>
              {pages.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={p === page ? 'page-btn active' : 'page-btn'}
                  onClick={() => router.get({ route: 'usuarios', qs: filters({ page: p }) })}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="page-btn"
                aria-label="Página siguiente"
                disabled={page >= lastPage}
                onClick={() => router.get({ route: 'usuarios', qs: filters({ page: page + 1 }) })}
              >
                <Icon name="chevronRight" size={16} />
              </button>
            </div>
          </div>
        </footer>
      </div>

      {showModal && (
        <div className="kits-modal-overlay" onClick={() => setShowModal(false)}>
          {/*
            Maqueta: el alta de usuarios sigue sin ruta que la escriba, que es la pregunta más
            urgente del proyecto (ver docs/01-requirements/modulos-pendientes.md).
          */}
          <div className="kits-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="btn btn-icon kits-modal-close"
              aria-label="Cerrar"
              onClick={() => setShowModal(false)}
            >
              <Icon name="close" size={18} />
            </button>
            <h1 className="kits-modal-title">Nuevo usuario</h1>
            <p className="kits-modal-subtitle">Completa los campos</p>
            <div className="kits-modal-tabs">
              <span className="kits-modal-tab active">Propiedades</span>
            </div>
            <div className="kits-modal-fields">
              <label className="kits-field">
                <span>Nombre</span>
                <input type="text" placeholder="Nombre" />
              </label>
              <label className="kits-field">
                <span>Correo</span>
                <input type="email" placeholder="correo@ejemplo.com" />
              </label>
              <label className="kits-field">
                <span>Area</span>
                <input type="text" placeholder="Area" />
              </label>
              <label className="kits-field">
                <span>Rol</span>
                <input type="text" placeholder="Rol" />
              </label>
            </div>
            <div className="kits-modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" disabled>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
