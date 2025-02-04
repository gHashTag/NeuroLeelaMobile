import { botFarm } from '@/server'

export class BotService {
  constructor() {
    // Логируем состояние botFarm для отладки
    console.log('Initializing BotService, botFarm:', botFarm)

    if (!botFarm || botFarm.length === 0) {
      console.log('botFarm is not initialized')
    } else {
      console.log('botFarm is initialized')
      botFarm.forEach(bot => {
        bot.on('message', ctx => {
          console.log(ctx)
          ctx.reply('Hello from bot service')
        })
      })
    }
  }
  //test bots
  public handleUpdate(update: any): void {
    console.log('Обновление получено:', update)
    if (!botFarm || botFarm.length === 0) {
      console.log('botFarm is not initialized')
    } else {
      console.log('botFarm is initialized')
      botFarm.forEach(bot => {
        bot.handleUpdate(update)
      })
    }
  }
}
