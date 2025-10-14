import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { LoginRequest, LoginResponse, User, GetCurrentUserResponse } from '../types/APIs/authApiType';

interface TabAccessResponse {
  success: boolean;
  message: string;
  result: {
    _id: string;
    name: string;
    avatarUrl: string;
  }[];
}

interface TabAccessRequest {
  tabName: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    // Adjusted baseUrl to be more generic, allowing for different prefixes like /auth and /user
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
  tagTypes: ['Auth', 'UserTabs'], // Added a new tag type
  endpoints: (builder) => ({
    // --- AUTH ENDPOINTS ---
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login', // Prefixed with /auth
        method: 'POST',
        body: credentials,
      }),
      onQueryStarted: async (arg, { queryFulfilled }) => {
        try {
          const { data }: any = await queryFulfilled;
          localStorage.setItem('userToken', data?.data?.token);
        } catch (error) {
          console.error('Login failed:', error);
        }
      },
      invalidatesTags: ['Auth'],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),

    updateProfileImage: builder.mutation<User, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: '/auth/update-profile-image', // Prefixed with /auth
          method: 'PUT',
          body: formData,
        };
      },
      invalidatesTags: ['Auth'],
    }),

    getCurrentUser: builder.query<GetCurrentUserResponse, void>({
      query: () => '/auth/me', // Prefixed with /auth
      providesTags: ['Auth'],
    }),

    // --- NEW USER ENDPOINT ---
    getTabAccess: builder.query<TabAccessResponse, any>({
      query: (tabName) => {
        const _cacheBuster = Date.now()
        return {
          url: '/user/get-access-of-tabs',
          params: { tabName, _cacheBuster },
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useUpdateProfileImageMutation,
  useGetCurrentUserQuery,
  useGetTabAccessQuery,
  useLazyGetTabAccessQuery
} = authApi;


