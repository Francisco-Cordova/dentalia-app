/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

router
  .group(() => {
    router.get('/', [controllers.Session, 'create']).as('session.create')

    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.post('login/magic', [controllers.MagicLink, 'send'])
    router.get('auth/magic/:token', [controllers.MagicLink, 'verify'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.on('/skus').renderInertia('skus', {}).as('skus')
    router.on('/familias').renderInertia('familias', {}).as('familias')
    router.on('/insumos').renderInertia('insumos', {}).as('insumos')
    router.on('/kits').renderInertia('kits', {}).as('kits')
    router.on('/usuarios').renderInertia('usuarios', {}).as('usuarios')
    router.on('/zonas').renderInertia('zonas', {}).as('zonas')
    router.on('/modulos-de-salud').renderInertia('modulos_de_salud', {}).as('modulosDeSalud')
    router.on('/home').renderInertia('home', {}).as('home')
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())
