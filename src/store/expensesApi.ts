import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface AddClientExpenseRequest {
  type: 'client';
  description: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  expreseCategory: string; // keeping key as provided
  netAmount: number;
  vatPercentage: number; // vatPercentage
  vatAmount: number;
  totalAmount: number;
  status: 'yes' | 'no'; // yes => Invoiced, no => Not Invoiced
  file?: File | null;
}

export interface AddClientExpenseResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const expensesApi = createApi({
  reducerPath: 'expensesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/expense`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('userToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('ngrok-skip-browser-warning', '69420');
      return headers;
    },
  }),
  tagTypes: ['Expense'],
  endpoints: (builder) => ({
    addClientExpense: builder.mutation<AddClientExpenseResponse, AddClientExpenseRequest>({
      query: (payload) => {
        const formData = new FormData();
        formData.append('type', payload.type);
        formData.append('description', payload.description);
        formData.append('clientId', payload.clientId);
        formData.append('date', payload.date);
        formData.append('expreseCategory', payload.expreseCategory);
        formData.append('netAmount', String(payload.netAmount));
        formData.append('vatPercentage', String(payload.vatPercentage));
        formData.append('vatAmount', String(payload.vatAmount));
        formData.append('totalAmount', String(payload.totalAmount));
        formData.append('status', payload.status);
        if (payload.file) {
          formData.append('file', payload.file);
        }

        return {
          url: '/add',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Expense'],
    }),
  }),
});

export const { useAddClientExpenseMutation } = expensesApi;


