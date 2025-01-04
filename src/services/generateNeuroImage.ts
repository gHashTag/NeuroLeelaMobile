import { replicate } from '../core/replicate';
import { getAspectRatio, savePrompt } from '../core/supabase/ai';

import { processApiResponse } from '@/helpers/processApiResponse';
import { GenerationResult } from '@/interfaces/generate.interface';
import { downloadFile } from '@/helpers/downloadFile';
import bot from '@/core/bot';
import { InputFile } from 'grammy';
import { pulse } from '@/helpers/pulse';
import { imageNeuroGenerationCost, processBalanceOperation } from '@/helpers/telegramStars/telegramStars';

export async function generateNeuroImage(
  prompt: string,
  model_url: `${string}/${string}` | `${string}/${string}:${string}`,
  num_images: number,
  telegram_id: number,
  username: string,
  is_ru: boolean,
): Promise<GenerationResult | null> {
  console.log('Starting generateNeuroImage with:', { prompt, model_url, telegram_id, num_images, username, is_ru });

  try {
    // Проверка баланса для всех изображений
    const totalCost = imageNeuroGenerationCost * num_images;
    const balanceCheck = await processBalanceOperation({ telegram_id, paymentAmount: totalCost, is_ru });
    if (!balanceCheck.success) {
      throw new Error(balanceCheck.error);
    }

    const aspect_ratio = await getAspectRatio(telegram_id);
    const results: GenerationResult[] = [];
    const input = {
      prompt: `Fashionable: ${prompt}`,
      negative_prompt: 'nsfw, erotic, violence, bad anatomy...',
      num_inference_steps: 28,
      guidance_scale: 7,
      ...(aspect_ratio === '1:1'
        ? { width: 1024, height: 1024 }
        : aspect_ratio === '16:9'
        ? { width: 1368, height: 768 }
        : aspect_ratio === '9:16'
        ? { width: 768, height: 1368 }
        : { width: 1024, height: 1024 }),
      sampler: 'flowmatch',
      num_outputs: 1,
      aspect_ratio,
    };

    // Цикл генерации изображений
    for (let i = 0; i < num_images; i++) {
      console.log(`Generating image ${i + 1} of ${num_images}`);
      if (num_images > 1) {
        bot.api.sendMessage(
          telegram_id,
          is_ru ? `⏳ Генерация изображения ${i + 1} из ${num_images}` : `⏳ Generating image ${i + 1} of ${num_images}`,
        );
      } else {
        bot.api.sendMessage(telegram_id, is_ru ? '⏳ Генерация...' : '⏳ Generating...', {
          reply_markup: { remove_keyboard: true },
        });
      }

      const output = await replicate.run(model_url, { input });
      const imageUrl = await processApiResponse(output);

      if (!imageUrl || imageUrl.endsWith('empty.zip')) {
        console.error(`Failed to generate image ${i + 1}`);
        continue;
      }

      const image = await downloadFile(imageUrl);
      const prompt_id = await savePrompt(prompt, model_url, imageUrl, telegram_id);

      if (prompt_id === null) {
        console.error(`Failed to save prompt for image ${i + 1}`);
        continue;
      }

      // Отправляем каждое изображение
      await bot.api.sendPhoto(telegram_id, new InputFile(image));

      // Сохраняем результат
      results.push({ image, prompt_id });

      // Отправляем в pulse
      const pulseImage = Buffer.isBuffer(image) ? `data:image/jpeg;base64,${image.toString('base64')}` : image;
      await pulse(pulseImage, prompt, `/${model_url}`, telegram_id, username, is_ru);
    }

    await bot.api.sendMessage(
      telegram_id,
      is_ru
        ? `Ваши изображения сгенерированы!\n\nСгенерировать еще?\n\nСтоимость: ${(imageNeuroGenerationCost * num_images).toFixed(
            2,
          )} ⭐️\nВаш новый баланс: ${balanceCheck.newBalance.toFixed(2)} ⭐️`
        : `Your images have been generated!\n\nGenerate more?\n\nCost: ${(imageNeuroGenerationCost * num_images).toFixed(
            2,
          )} ⭐️\nYour new balance: ${balanceCheck.newBalance.toFixed(2)} ⭐️`,
      {
        reply_markup: {
          keyboard: [
            [{ text: '1️⃣' }, { text: '2️⃣' }, { text: '3️⃣' }, { text: '4️⃣' }],
            [{ text: is_ru ? '⬆️ Улучшить промпт' : '⬆️ Improve prompt' }, { text: is_ru ? '📐 Изменить размер' : '📐 Change size' }],
            [{ text: is_ru ? '🏠 Главное меню' : '🏠 Main menu' }],
          ],
          resize_keyboard: false,
        },
      },
    );

    return results[0] || null;
  } catch (error) {
    console.error('Error in generateNeuroImage:', error);
    throw error;
  }
}
