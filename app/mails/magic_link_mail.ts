import { BaseMail } from '@adonisjs/mail'
import type User from '#models/user'

export default class MagicLinkMail extends BaseMail {
  subject = 'Tu enlace de acceso a Dentalia'

  constructor(
    private user: User,
    private url: string
  ) {
    super()
  }

  prepare() {
    this.message.to(this.user.email)
    this.message.htmlView('emails/magic_link', {
      fullName: this.user.fullName || this.user.email,
      url: this.url,
    })
  }
}
