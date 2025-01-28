import { getAiFeedbackFromSupabase, updateHistory } from '@/core/supabase'

export class AiAssistantService {
  public async getAiResponse(
    telegram_id: string,
    assistant_id: string,
    report: string,
    language_code: string,
    full_name: string
  ): Promise<{ ai_response: string; annotations: any }> {
    const { ai_response, annotations } = await getAiFeedbackFromSupabase({
      assistant_id,
      report,
      language_code,
      full_name,
    })
    console.log(annotations, 'annotations')
    await updateHistory({
      telegram_id,
      report,
      ai_response,
    })
    return { ai_response, annotations }
  }
}
