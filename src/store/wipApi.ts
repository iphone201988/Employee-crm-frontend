import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface GetWipResponse {
  success: boolean;
  message: string;
  data: any[];
}

export const wipApi = createApi({
  reducerPath: 'wipApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('userToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('ngrok-skip-browser-warning', '69420');
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getWip: builder.query<GetWipResponse, void>({
      query: () => ({ url: '/wip' }),
    }),
    addWipOpenBalance: builder.mutation<any, { type: 'client' | 'job'; amount: number; clientId?: string; jobId?: string }>({
      query: (payload) => ({
        url: '/wip/open-balance',
        method: 'POST',
        body: payload,
      }),
    }),
    attachWipTarget: builder.mutation<any, { type: 'client' | 'job'; wipTargetId: string; clientId?: string; jobId?: string }>({
      query: (payload) => ({
        url: '/wip/attach-wip-target',
        method: 'POST',
        body: payload,
      }),
    }),
  }),
});

export const { useGetWipQuery, useAddWipOpenBalanceMutation, useAttachWipTargetMutation } = wipApi;


