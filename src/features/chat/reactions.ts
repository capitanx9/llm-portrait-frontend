import { baseApi } from '../../api/baseApi'
import type { components } from '../../api/schema'

export type ReactionAggregate = components['schemas']['ReactionAggregate']

export const REACTION_PICKER_EMOJI: readonly string[] = ['👍', '❤️', '😂', '😮', '😢']

interface MutationArgs {
  messageId: number
  emoji: string
  roomName: string
}

export const reactionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    addReaction: build.mutation<unknown, MutationArgs>({
      query: ({ messageId, emoji }) => ({
        url: `/api/chat/messages/${messageId}/reactions/`,
        method: 'POST',
        body: { emoji },
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Messages' as const, id: arg.roomName }],
    }),

    removeReaction: build.mutation<unknown, MutationArgs>({
      query: ({ messageId, emoji }) => ({
        url: `/api/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Messages' as const, id: arg.roomName }],
    }),
  }),
})

export const { useAddReactionMutation, useRemoveReactionMutation } = reactionsApi
