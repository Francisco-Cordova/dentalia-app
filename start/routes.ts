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

    router.get('signup', [controllers.NewAccount, 'create']).as('new_account.create')
    router.post('signup', [controllers.NewAccount, 'store']).as('new_account.store')

    router.post('login/magic', [controllers.MagicLink, 'send']).as('magic_link.send')
    router.get('auth/magic/:token', [controllers.MagicLink, 'verify']).as('magic_link.verify')
  })
  .use(middleware.guest())

router
  .group(() => {
    router.on('/skus').renderInertia('skus', {}).as('skus')
    router.on('/familias').renderInertia('familias', {}).as('familias')
    router.get('/insumos', [controllers.Insumos, 'index']).as('insumos')
    router.get('/kits', [controllers.Kits, 'index']).as('kits')
    router.on('/usuarios').renderInertia('usuarios', {}).as('usuarios')
    router.get('/zonas', [controllers.Zonas, 'index']).as('zonas')
    router.get('/modulos-de-salud', [controllers.ModulosSalud, 'index']).as('modulosDeSalud')
    router.on('/home').renderInertia('home', {}).as('home')
    router.post('logout', [controllers.Session, 'destroy']).as('session.destroy')
  })
  .use(middleware.auth())
