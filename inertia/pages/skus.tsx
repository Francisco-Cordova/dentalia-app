import Icon from '~/components/icon'

type SkuRow = {
  id: number
  nombre: string
  tratamiento: string
  sku: string
  tipo: string
  estatus: 'activo' | 'edicion'
  familia: string
  modulo: string
  especialidad: string
}

const skus: SkuRow[] = [
  {
    id: 1,
    nombre: 'APARTADO DE ORTODONCIA Y ORTOPEDIA BASICO KONFRONT',
    tratamiento: '5004',
    sku: '2.3',
    tipo: 'Tratamiento',
    estatus: 'activo',
    familia: '',
    modulo: '',
    especialidad: '',
  },
  {
    id: 2,
    nombre: 'URGENCIAS AVANZADAS SANITAS',
    tratamiento: '5011',
    sku: '3.1',
    tipo: 'Tratamiento',
    estatus: 'activo',
    familia: '',
    modulo: '',
    especialidad: '',
  },
  {
    id: 3,
    nombre: 'PROFILAXIS INTEGRAL ODONTOLOGICA',
    tratamiento: '5007',
    sku: '4.2',
    tipo: 'Tratamiento',
    estatus: 'activo',
    familia: '',
    modulo: '',
    especialidad: '',
  },
  {
    id: 4,
    nombre: 'EXTRACCIONES QUIRURGICAS',
    tratamiento: '5053',
    sku: '5.0',
    tipo: 'Tratamiento',
    estatus: 'edicion',
    familia: '',
    modulo: '',
    especialidad: '',
  },
  {
    id: 5,
    nombre: 'PERIODONCIA BASICA MASC',
    tratamiento: '5089',
    sku: '6.1',
    tipo: 'Tratamiento',
    estatus: 'activo',
    familia: '',
    modulo: '',
    especialidad: '',
  },
  {
    id: 6,
    nombre: 'ENDODONCIA ANTERIORES',
    tratamiento: '5178',
    sku: '7.4',
    tipo: 'Tratamiento',
    estatus: 'activo',
    familia: '',
    modulo: '',
    especialidad: '',
  },
  {
    id: 7,
    nombre: 'REHABILITACION ORAL TOTAL',
    tratamiento: '5210',
    sku: '8.2',
    tipo: 'Tratamiento',
    estatus: 'edicion',
    familia: '',
    modulo: '',
    especialidad: '',
  },
  {
    id: 8,
    nombre: 'ORTODONCIA LIMITADA',
    tratamiento: '5298',
    sku: '9.5',
    tipo: 'Tratamiento',
    estatus: 'activo',
    familia: '',
    modulo: '',
    especialidad: '',
  },
  {
    id: 9,
    nombre: 'CONSULTA INICIAL NIÑOS',
    tratamiento: '5302',
    sku: '10.0',
    tipo: 'Tratamiento',
    estatus: 'activo',
    familia: '',
    modulo: '',
    especialidad: '',
  },
  {
    id: 10,
    nombre: 'IMPLANTOLOGIA BASICA',
    tratamiento: '5333',
    sku: '11.2',
    tipo: 'Tratamiento',
    estatus: 'activo',
    familia: '',
    modulo: '',
    especialidad: '',
  },
]

export default function Skus() {
  return (
    <div className="skus-page">
      <div className="skus-topbar">
        <button type="button" className="btn btn-primary">
          <Icon name="plusLg" size={18} />
          Nuevo SKU
        </button>
        <div className="sku-actions2">
          <button type="button" className="btn btn-outline">
            <Icon name="pencil" size={18} />
            Edición masiva
          </button>
          <button type="button" className="btn btn-outline">
            <Icon name="arrowsDownUp" size={18} />
            Ordenar
          </button>
        </div>
      </div>

      <div className="skus-toolbar">
        <label className="skus-search">
          <Icon name="search" size={16} />
          <input type="search" placeholder="Buscar Nombre" />
        </label>
        <label className="skus-search">
          <Icon name="search" size={16} />
          <input type="search" placeholder="Buscar ID de tratamiento" />
        </label>
        <label className="skus-search">
          <Icon name="search" size={16} />
          <input type="search" placeholder="Buscar ID SKU" />
        </label>
      </div>

      <div className="skus-card">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Estatus</th>
              <th>Familia</th>
              <th>Módulo de salud</th>
              <th>Especialidad</th>
              <th aria-label="Ver" />
            </tr>
          </thead>
          <tbody>
            {skus.map((sku) => (
              <tr key={sku.id}>
                <td>
                  <div className="sku-name">{sku.nombre}</div>
                  <div className="sku-code">
                    Tratamiento {sku.tratamiento} · SKU {sku.sku}
                  </div>
                </td>
                <td className="sku-cell">{sku.tipo}</td>
                <td className="sku-cell">
                  <span
                    className={sku.estatus === 'activo' ? 'pill pill-success' : 'pill pill-gray'}
                  >
                    <Icon name={sku.estatus === 'activo' ? 'check' : 'slashCircle'} size={14} />
                    {sku.estatus === 'activo' ? 'Activo' : 'Edición'}
                  </span>
                </td>
                <td className="sku-cell">{sku.familia}</td>
                <td className="sku-cell">{sku.modulo}</td>
                <td className="sku-cell">{sku.especialidad}</td>
                <td className="sku-cell sku-cell-view">
                  <button type="button" className="btn btn-icon" aria-label={`Ver ${sku.nombre}`}>
                    <Icon name="externalLink" size={18} />
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
            <span>1-10 de 321</span>
            <button type="button" className="page-btn" aria-label="Página anterior">
              <Icon name="chevronLeft" size={16} />
            </button>
            {[1, 2, 3, 4, 5].map((page) => (
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
    </div>
  )
}
