import MagicLink from '#models/magic_link'
import User from '#models/user'
import MagicLinkMail from '#mails/magic_link_mail'
import { magicLinkValidator } from '#validators/user'
import app from '@adonisjs/core/services/app'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import { createHash, randomBytes } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'

const TOKEN_TTL_MINUTES = 30

export default class MagicLinkController {
  async send({ request, response, session }: HttpContext) {
    const { email } = await request.validateUsing(magicLinkValidator)
    const user = await User.findBy('email', email)

    if (user) {
      const token = randomBytes(32).toString('hex')
      const now = DateTime.now()

      await MagicLink.create({
        userId: user.id,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt: now.plus({ minutes: TOKEN_TTL_MINUTES }),
        createdAt: now,
      })

      const url = `${env.get('APP_URL')}/auth/magic/${token}`

      try {
        await mail.send(new MagicLinkMail(user, url))
      } catch (error) {
        logger.error({ err: error }, 'Error al enviar el magic link')
        if (app.inDev) {
          logger.info(`[MAGIC LINK DEV] ${url}`)
        } else {
          throw error
        }
      }
    }

    session.flash('success', 'Si tu correo está registrado, recibirás un enlace de acceso.')
    return response.redirect().back()
  }

  async verify({ auth, request, response, session }: HttpContext) {
    const token = request.param('token')
    const tokenHash = createHash('sha256').update(token).digest('hex')

    const magicLink = await MagicLink.query()
      .where('token_hash', tokenHash)
      .whereNull('used_at')
      .preload('user')
      .first()

    if (!magicLink || magicLink.expiresAt.diffNow().toMillis() <= 0) {
      session.flash('error', 'El enlace es inválido o ya expiró. Solicita uno nuevo.')
      return response.redirect().toRoute('session.create')
    }

    magicLink.usedAt = DateTime.now()
    await magicLink.save()

    await auth.use('web').login(magicLink.user)
    return response.redirect().toRoute('skus')
  }
}
