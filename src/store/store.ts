import { configureStore } from '@reduxjs/toolkit'

export const store = configureStore({
  reducer: {
    // add slices here, e.g. user: userReducer
    // add RTK Query API reducers here, e.g. [api.reducerPath]: api.reducer
  },
  // middleware: (getDefault) => getDefault().concat(api.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
