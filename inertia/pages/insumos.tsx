import Icon from '~/components/icon'

type InsumoRow = {
  id: number
  nombre: string
  codigo: string
  categoria: string
  cantidad: string
  costo: string
}

const insumos: InsumoRow[] = [
  {
    id: 1,
    nombre: 'ACRILICO POLVO RAPIDO ROSA NO.R2V (AUTOCURABLE) 90 GR',
    codigo: '#O0679',
    categoria: 'NIC TONE',
    cantidad: '1',
    costo: '$214.16',
  },
  {
    id: 2,
    nombre: 'BANDA SENCILLA INFERIOR DERECHO 12',
    codigo: '#M1526',
    categoria: 'AMERICAN ORTHODONTICS',
    cantidad: '1',
    costo: '$11.42',
  },
  {
    id: 3,
    nombre: 'TIRAS DE CELULOIDE (50 PZS)',
    codigo: '#M1706',
    categoria: 'ABC DENTAL',
    cantidad: '1',
    costo: '$7.77',
  },
  {
    id: 4,
    nombre: 'GRAPA #8A -RDCM8A-.',
    codigo: '#I0896',
    categoria: 'HU-FRIEDY',
    cantidad: '1',
    costo: '$162.69',
  },
  {
    id: 5,
    nombre: 'ARCO NITI .016 X .022 INF. PZA. 381-170.',
    codigo: '#M5207',
    categoria: 'TP ORTHODONTICS',
    cantidad: '1',
    costo: '$31.67',
  },
  {
    id: 6,
    nombre: '108.067 TRANSFER SF CUBETA ABIERTA, TITANIUM, 4.1 MM',
    codigo: '#I2535',
    categoria: 'NEODENT',
    cantidad: '1',
    costo: '$189.80',
  },
  {
    id: 7,
    nombre: 'TIJERA GOLDMAN FOX RECTA',
    codigo: '#M6111',
    categoria: 'ARAIN',
    cantidad: '1',
    costo: '$33.15',
  },
  {
    id: 8,
    nombre: 'BANDA SENCILLA INFERIOR IZQUIERDA 9',
    codigo: '#M0646',
    categoria: 'AMERICAN ORTHODONTICS',
    cantidad: '1',
    costo: '$10.67',
  },
  {
    id: 9,
    nombre: 'GUTAPERCHA EXTRA FINE',
    codigo: '#I1063',
    categoria: 'HYGENIC',
    cantidad: '100',
    costo: '$154.41',
  },
  {
    id: 10,
    nombre: 'BANDA TUBO TRIPLE SUPERIOR IZQUIERDA 31+',
    codigo: '#M0605',
    categoria: '3M UNITEK',
    cantidad: '1',
    costo: '$48.48',
  },
]

export default function Insumos() {
  return (
    <div className="skus-page">
      <div className="skus-topbar">
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
          <input type="search" placeholder="Buscar Nombre" />
        </label>
        <label className="skus-search">
          <Icon name="search" size={16} />
          <input type="search" placeholder="Buscar ID" />
        </label>
      </div>

      <div className="skus-card">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoria</th>
              <th>Cantidad</th>
              <th>Costo</th>
            </tr>
          </thead>
          <tbody>
            {insumos.map((insumo) => (
              <tr key={insumo.id}>
                <td>
                  <div className="sku-name">{insumo.nombre}</div>
                  <div className="sku-code">{insumo.codigo}</div>
                </td>
                <td className="sku-cell">{insumo.categoria}</td>
                <td className="sku-cell">{insumo.cantidad}</td>
                <td className="sku-cell">{insumo.costo}</td>
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
            <span>1-10 de 5,033</span>
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
