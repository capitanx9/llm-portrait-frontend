import { baseApi } from '../../api/baseApi'
import type { components } from '../../api/schema'

export type TargetLanguage = components['schemas']['TargetLanguageEnum']
export type AiAction = components['schemas']['ActionEnum']
export type ProcessRequest = components['schemas']['ProcessRequest']
export type ProcessResponse = components['schemas']['ProcessResponse']
export type ConversationTurn = components['schemas']['ConversationTurn']

export const TARGET_LANGUAGES: ReadonlyArray<{
  code: TargetLanguage
  label: string
}> = [
  { code: 'ru', label: 'Russian' },
  { code: 'en', label: 'English' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
]

export const aiApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    processAi: build.mutation<ProcessResponse, ProcessRequest>({
      query: (body) => ({
        url: '/api/ai/process/',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const { useProcessAiMutation } = aiApi
