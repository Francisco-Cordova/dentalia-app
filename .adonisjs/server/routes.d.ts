import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'session.create': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'magic_link.send': { paramsTuple?: []; params?: {} }
    'magic_link.verify': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'skus': { paramsTuple?: []; params?: {} }
    'familias': { paramsTuple?: []; params?: {} }
    'insumos': { paramsTuple?: []; params?: {} }
    'kits': { paramsTuple?: []; params?: {} }
    'usuarios': { paramsTuple?: []; params?: {} }
    'zonas': { paramsTuple?: []; params?: {} }
    'modulosDeSalud': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'session.create': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'magic_link.verify': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'skus': { paramsTuple?: []; params?: {} }
    'familias': { paramsTuple?: []; params?: {} }
    'insumos': { paramsTuple?: []; params?: {} }
    'kits': { paramsTuple?: []; params?: {} }
    'usuarios': { paramsTuple?: []; params?: {} }
    'zonas': { paramsTuple?: []; params?: {} }
    'modulosDeSalud': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'session.create': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'magic_link.verify': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'skus': { paramsTuple?: []; params?: {} }
    'familias': { paramsTuple?: []; params?: {} }
    'insumos': { paramsTuple?: []; params?: {} }
    'kits': { paramsTuple?: []; params?: {} }
    'usuarios': { paramsTuple?: []; params?: {} }
    'zonas': { paramsTuple?: []; params?: {} }
    'modulosDeSalud': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'magic_link.send': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}