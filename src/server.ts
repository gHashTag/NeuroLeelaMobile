import dotenv from 'dotenv'

// Загружаем переменные окружения из .env файла
dotenv.config()
import 'reflect-metadata'
import { App } from '@/app'

import { ValidateEnv } from '@utils/validateEnv'

import { routes } from './routes'
import { Telegraf } from 'telegraf'
import { isDev } from './config'

// Убедитесь, что у вас есть массив портов для каждого бота
const PORTS = [1980, 1981] // Убедитесь, что порты уникальны и не заняты

ValidateEnv()

const app = new App(routes)

// Создаем массив токенов для ботов
const BOT_TOKENS = [process.env.TELEGRAM_BOT_TOKEN_DEV, process.env.BOT_TOKEN_2]

// Инициализируем ботов
const createBotFarm = () => {
  return BOT_TOKENS.map(token => new Telegraf(token))
}

export const botFarm: Telegraf[] = createBotFarm()

// Обработка текстовых сообщений для каждого бота
botFarm.forEach((bot, index) => {
  bot.on('text', ctx => {
    ctx.reply(`I am bot${index + 1}`)
  })
})

console.log('CASE 2: botFarm: botFarm', process.env.WEBHOOK_URL)

// Настройка вебхука для каждого бота
botFarm.forEach((bot, index) => {
  const webhookUrl = isDev
    ? process.env.WEBHOOK_URL_DEV
    : process.env.WEBHOOK_URL

  console.log('CASE 3: botFarm: webhookUrl', webhookUrl)

  if (!webhookUrl) {
    console.error('WEBHOOK_URL не определен. Проверьте настройки окружения.')
    return // Прекращаем выполнение, если URL не определен
  }

  const port = PORTS[index] // Получаем порт для текущего бота
  if (!isDev) {
    console.log('CASE 4: botFarm: launch', port)
    bot.launch({
      webhook: {
        domain: webhookUrl,
        port: port, // Используем уникальный порт для каждого бота
        path: '/webhook', // Путь для вебхука
      },
    })
  } else {
    console.log('CASE 5: botFarm: launch')
    bot.launch()
  }
})

app.listen()
