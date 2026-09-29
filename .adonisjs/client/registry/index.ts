/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['session.create']['types'],
  },
  'new_account.create': {
    methods: ["GET","HEAD"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['new_account.create']['types'],
  },
  'new_account.store': {
    methods: ["POST"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['new_account.store']['types'],
  },
  'magic_link.send': {
    methods: ["POST"],
    pattern: '/login/magic',
    tokens: [{"old":"/login/magic","type":0,"val":"login","end":""},{"old":"/login/magic","type":0,"val":"magic","end":""}],
    types: placeholder as Registry['magic_link.send']['types'],
  },
  'magic_link.verify': {
    methods: ["GET","HEAD"],
    pattern: '/auth/magic/:token',
    tokens: [{"old":"/auth/magic/:token","type":0,"val":"auth","end":""},{"old":"/auth/magic/:token","type":0,"val":"magic","end":""},{"old":"/auth/magic/:token","type":1,"val":"token","end":""}],
    types: placeholder as Registry['magic_link.verify']['types'],
  },
  'skus': {
    methods: ["GET","HEAD"],
    pattern: '/skus',
    tokens: [{"old":"/skus","type":0,"val":"skus","end":""}],
    types: placeholder as Registry['skus']['types'],
  },
  'insumos': {
    methods: ["GET","HEAD"],
    pattern: '/insumos',
    tokens: [{"old":"/insumos","type":0,"val":"insumos","end":""}],
    types: placeholder as Registry['insumos']['types'],
  },
  'kits': {
    methods: ["GET","HEAD"],
    pattern: '/kits',
    tokens: [{"old":"/kits","type":0,"val":"kits","end":""}],
    types: placeholder as Registry['kits']['types'],
  },
  'usuarios': {
    methods: ["GET","HEAD"],
    pattern: '/usuarios',
    tokens: [{"old":"/usuarios","type":0,"val":"usuarios","end":""}],
    types: placeholder as Registry['usuarios']['types'],
  },
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/home',
    tokens: [{"old":"/home","type":0,"val":"home","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
