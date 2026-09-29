import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.tsx'))['default']>
    'auth/signup': ExtractProps<(typeof import('../../inertia/pages/auth/signup.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'familias': ExtractProps<(typeof import('../../inertia/pages/familias.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'insumos': ExtractProps<(typeof import('../../inertia/pages/insumos.tsx'))['default']>
    'kits': ExtractProps<(typeof import('../../inertia/pages/kits.tsx'))['default']>
    'modulos_de_salud': ExtractProps<(typeof import('../../inertia/pages/modulos_de_salud.tsx'))['default']>
    'skus': ExtractProps<(typeof import('../../inertia/pages/skus.tsx'))['default']>
    'usuarios': ExtractProps<(typeof import('../../inertia/pages/usuarios.tsx'))['default']>
    'zonas': ExtractProps<(typeof import('../../inertia/pages/zonas.tsx'))['default']>
  }
}
