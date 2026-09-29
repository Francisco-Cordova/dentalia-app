/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  session: {
    create: typeof routes['session.create']
    destroy: typeof routes['session.destroy']
  }
  newAccount: {
    create: typeof routes['new_account.create']
    store: typeof routes['new_account.store']
  }
  magicLink: {
    send: typeof routes['magic_link.send']
    verify: typeof routes['magic_link.verify']
  }
  skus: typeof routes['skus']
  insumos: typeof routes['insumos']
  kits: typeof routes['kits']
  usuarios: typeof routes['usuarios']
  zonas: typeof routes['zonas']
  home: typeof routes['home']
}
