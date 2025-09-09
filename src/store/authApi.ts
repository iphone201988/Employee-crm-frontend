import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { LoginRequest, LoginResponse, User } from '../types/APIs/authApiType';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/auth`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('userToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
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
    
    // Optional: Get current user endpoint
    getCurrentUser: builder.query<User, void>({
      query: () => '/me',
      providesTags: ['Auth'],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
} = authApi;
