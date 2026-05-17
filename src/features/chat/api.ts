import { baseApi } from '../../api/baseApi'
import type { components } from '../../api/schema'

export type Room = components['schemas']['Room']
export type ChatMessage = components['schemas']['Message']

type PaginatedRoomList = components['schemas']['PaginatedRoomList']
type PaginatedMessageList = components['schemas']['PaginatedMessageList']

export const chatApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRooms: build.query<Room[], void>({
      query: () => ({ url: '/api/chat/rooms/', params: { limit: 100 } }),
      transformResponse: (response: PaginatedRoomList) => response.results,
      providesTags: (rooms) =>
        rooms
          ? [
              ...rooms.map((r) => ({ type: 'Room' as const, id: r.id })),
              { type: 'Room' as const, id: 'LIST' },
            ]
          : [{ type: 'Room' as const, id: 'LIST' }],
    }),

    createRoom: build.mutation<Room, { name: string }>({
      query: (body) => ({
        url: '/api/chat/rooms/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Room', id: 'LIST' }],
    }),

    getMessages: build.query<
      { results: ChatMessage[]; hasMore: boolean },
      { name: string; before?: number; limit?: number }
    >({
      query: ({ name, before, limit = 50 }) => ({
        url: `/api/chat/rooms/${encodeURIComponent(name)}/messages/`,
        params: { limit, ...(before !== undefined ? { before } : {}) },
      }),
      transformResponse: (response: PaginatedMessageList) => ({
        results: response.results,
        hasMore: !!response.next,
      }),
      providesTags: (_result, _err, arg) => [{ type: 'Messages', id: arg.name }],
    }),
  }),
})

export const { useGetRoomsQuery, useCreateRoomMutation, useGetMessagesQuery } = chatApi
