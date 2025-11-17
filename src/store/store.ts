import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './authApi';
import { categoryApi } from './categoryApi';
import { teamApi } from './teamApi';
import { clientApi } from './clientApi';
import { jobApi } from './jobApi';
import { companiesApi } from './companiesApi';
import { timesheetApi } from './timesheetApi';
import { expensesApi } from './expensesApi';
import { wipApi } from './wipApi';
import { notesApi } from './notesApi';
import { notificationApi } from './notificationApi';
export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer,
    [clientApi.reducerPath]: clientApi.reducer,
    [jobApi.reducerPath]: jobApi.reducer,
    [companiesApi.reducerPath]: companiesApi.reducer,
    [timesheetApi.reducerPath]: timesheetApi.reducer,
    [expensesApi.reducerPath]: expensesApi.reducer,
    [wipApi.reducerPath]: wipApi.reducer,
    [notesApi.reducerPath]: notesApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(categoryApi.middleware)
      .concat(teamApi.middleware)
      .concat(clientApi.middleware)
      .concat(jobApi.middleware)
      .concat(companiesApi.middleware)
      .concat(timesheetApi.middleware)
      .concat(expensesApi.middleware)
      .concat(wipApi.middleware)
      .concat(notesApi.middleware)
      .concat(notificationApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
