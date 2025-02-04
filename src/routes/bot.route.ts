// src/routes/bot.route.ts
import { Router } from 'express'
import { BotController } from '@/controllers'
import { BotService } from '@/services/bot.service'

export class BotRoute {
  public path = '/webhook'
  public router: Router = Router()
  private botController: BotController

  constructor() {
    const botService = new BotService()
    this.botController = new BotController(botService)
    this.initializeRoutes()
  }

  private initializeRoutes() {
    console.log('CASE 1: BotRoute: initializeRoutes')
    this.router.post(this.path, this.botController.handleWebhook)
  }
}
