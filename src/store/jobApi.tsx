import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Job } from '@/types/APIs/jobApiTypes';

export type CreateJobRequest = Omit<Job, '_id'>;

export interface CreateJobResponse {
  success: boolean;
  message: string;
  data: Job;
}

export const jobApi = createApi({
  reducerPath: 'jobApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/job`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('userToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Job'],
  endpoints: (builder) => ({
    createJob: builder.mutation<CreateJobResponse, CreateJobRequest>({
      query: (newJobData) => ({
        url: '/create',
        method: 'POST',
        body: newJobData,
      }),
   
      invalidatesTags: [{ type: 'Job', id: 'LIST' }],
    }),
  }),
});

export const {
  useCreateJobMutation,
} = jobApi;
