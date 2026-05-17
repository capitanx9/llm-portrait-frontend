import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from '../api/baseApi'
import { authReducer } from '../features/auth/slice'
import { chatReducer } from '../features/chat/slice'

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    chat: chatReducer,
  },
  middleware: (gDM) => gDM().concat(baseApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
