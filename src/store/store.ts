import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './authApi';
import { categoryApi } from './categoryApi';
import { teamApi } from './teamApi';
export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(categoryApi.middleware)
      .concat(teamApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
