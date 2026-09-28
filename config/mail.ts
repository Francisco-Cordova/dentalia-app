import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'smtp',

  from: env.get('MAIL_FROM') || 'no-reply@dentalia.local',

  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST') || 'localhost',
      port: env.get('SMTP_PORT') || 587,
      auth: env.get('SMTP_USERNAME')
        ? {
            type: 'login',
            user: env.get('SMTP_USERNAME')!,
            pass: env.get('SMTP_PASSWORD') ?? '',
          }
        : undefined,
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface Mailers extends InferMailers<typeof mailConfig> {}
}
