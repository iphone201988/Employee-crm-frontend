import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { authApi } from './authApi';

export interface Notification {
  _id: string;
  userId: string;
  companyId: string;
  type: 'timesheet_rejected' | 'timesheet_approved' | 'other';
  title: string;
  message: string;
  timesheetId?: string;
  weekStart?: string;
  weekEnd?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GetNotificationsResponse {
  success: boolean;
  message: string;
  data: {
    notifications: Notification[];
  };
}

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('userToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('ngrok-skip-browser-warning', '69420');
      return headers;
    },
  }),
  tagTypes: ['Notification', 'Auth'],
  endpoints: (builder) => ({
    getNotifications: builder.query<GetNotificationsResponse, void>({
      query: () => '/notification',
      providesTags: ['Notification'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Invalidate Auth to refetch current user (which will have newNotification set to false by backend)
          dispatch(authApi.util.invalidateTags(['Auth']));
        } catch (error) {
          console.error('Failed to fetch notifications', error);
        }
      },
    }),
    markNotificationAsRead: builder.mutation<void, string>({
      query: (notificationId) => ({
        url: `/notification/${notificationId}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsAsRead: builder.mutation<void, void>({
      query: () => ({
        url: '/notification/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} = notificationApi;

