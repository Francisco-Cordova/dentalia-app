import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    const email = 'francisco.cordova@konfront.mx'
    const existing = await User.findBy('email', email)
    if (existing) {
      console.log(`User already exists: ${email} (id: ${existing.id})`)
      return
    }
    await User.create({
      email,
      fullName: 'Francisco Cordova',
      password: `TempPass${Date.now().toString(36)}`,
    })
    console.log(`Created test user: ${email}`)
  }
}
