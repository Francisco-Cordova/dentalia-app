import { type ReactElement, useState } from 'react'
import { Form, Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { type Data } from '@generated/data'
import Icon from '~/components/icon'

type Section = 'skus' | 'insumos' | 'admin'

export default function AdminLayout({ children }: { children: ReactElement<Data.SharedProps> }) {
  const { url, props } = usePage()
  const user = props.user
  const activeSection: Section =
    url.includes('/usuarios') || url.includes('/zonas')
      ? 'admin'
      : url.includes('/insumos') || url.includes('/kits')
        ? 'insumos'
        : 'skus'
  const [collapsed, setCollapsed] = useState(false)
  const [open, setOpen] = useState<Section[]>(['admin', activeSection])
  const [userMenu, setUserMenu] = useState(false)
  const [prevUrl, setPrevUrl] = useState(url)

  if (prevUrl !== url) {
    setPrevUrl(url)
    setOpen(['admin', activeSection])
  }

  const toggle = (section: Section) =>
    setOpen((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    )

  return (
    <div className={`admin-layout${collapsed ? ' collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <Link route="skus" className="admin-logo" aria-label="Dentalia">
            {!collapsed && <img src="/logo-dentalia.svg" alt="Dentalia" />}
            {collapsed && <span className="admin-logo-mark">D</span>}
          </Link>
          <button
            type="button"
            className="admin-sidebar-toggle"
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Colapsar barra lateral"
          >
            <Icon name="layoutSidebarInset" size={18} />
          </button>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-group">
            <button
              type="button"
              className={`admin-nav-item${activeSection === 'skus' ? ' active' : ''}`}
              onClick={() => toggle('skus')}
            >
              <Icon name="gridFill" size={18} />
              {!collapsed && <span>SKUs</span>}
              {!collapsed && <Icon name="caretDown" size={14} className="admin-nav-caret" />}
            </button>
            {!collapsed && open.includes('skus') && (
              <div className="admin-nav-sub">
                <Link
                  route="skus"
                  className={`admin-nav-subitem${activeSection === 'skus' ? ' active' : ''}`}
                >
                  SKUs
                </Link>
                <a href="#" className="admin-nav-subitem">
                  Familias
                </a>
              </div>
            )}
          </div>

          <div className="admin-nav-group">
            <button
              type="button"
              className={`admin-nav-item${activeSection === 'insumos' ? ' active' : ''}`}
              onClick={() => toggle('insumos')}
            >
              <Icon name="boxSeam" size={18} />
              {!collapsed && <span>Insumos</span>}
              {!collapsed && <Icon name="caretDown" size={14} className="admin-nav-caret" />}
            </button>
            {!collapsed && open.includes('insumos') && (
              <div className="admin-nav-sub">
                <Link
                  route="insumos"
                  className={`admin-nav-subitem${url.includes('/insumos') ? ' active' : ''}`}
                >
                  insumos
                </Link>
                <Link
                  route="kits"
                  className={`admin-nav-subitem${url.includes('/kits') ? ' active' : ''}`}
                >
                  Kit de insumos
                </Link>
              </div>
            )}
          </div>

          <div className="admin-nav-group">
            <button
              type="button"
              className={`admin-nav-item${activeSection === 'admin' ? ' active' : ''}`}
              onClick={() => toggle('admin')}
            >
              <Icon name="keyFill" size={18} />
              {!collapsed && <span>Admin</span>}
              {!collapsed && <Icon name="caretDown" size={14} className="admin-nav-caret" />}
            </button>
            {!collapsed && open.includes('admin') && (
              <div className="admin-nav-sub">
                <Link
                  route="usuarios"
                  className={`admin-nav-subitem${url.includes('/usuarios') ? ' active' : ''}`}
                >
                  Usuarios
                </Link>
                <Link
                  route="zonas"
                  className={`admin-nav-subitem${url.includes('/zonas') ? ' active' : ''}`}
                >
                  Zonas
                </Link>
                <a href="#" className="admin-nav-subitem">
                  Módulos de salud
                </a>
              </div>
            )}
          </div>
        </nav>

        <div className="admin-user-card">
          <div className="admin-user-avatar">{user?.initials ?? 'D'}</div>
          {!collapsed && (
            <>
              <div className="admin-user-meta">
                <span className="admin-user-name">{user?.fullName ?? 'Dentalia'}</span>
                <span className="admin-user-email">{user?.email}</span>
              </div>
              <div className="admin-user-actions">
                <button
                  type="button"
                  className="admin-user-menu"
                  onClick={() => setUserMenu((v) => !v)}
                  aria-label="Opciones de usuario"
                >
                  <Icon name="dotsVertical" size={18} />
                </button>
                {userMenu && (
                  <Form route="session.destroy" className="admin-user-dropdown">
                    <button type="submit">Cerrar sesión</button>
                  </Form>
                )}
              </div>
            </>
          )}
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  )
}
