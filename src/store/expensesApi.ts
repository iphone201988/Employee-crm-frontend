import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface AddClientExpenseRequest {
  type: 'client' | 'team';
  description: string;
  clientId?: string; // For client expenses only
  userId?: string; // For team expenses only
  date: string; // YYYY-MM-DD
  expreseCategory: string; // keeping key as provided
  netAmount: number;
  vatPercentage: number; // vatPercentage
  vatAmount?: number;
  totalAmount?: number;
  status: 'yes' | 'no'; // yes => Invoiced/Paid, no => Not Invoiced/Not Paid
  file?: File | null;
}

export interface AddClientExpenseResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface ListExpensesRequest {
  status?: 'yes' | 'no' | 'all';
  type?: 'client' | 'team' | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseItem {
  _id: string;
  date: string;
  companyId: string;
  submittedBy: string;
  type: 'client' | 'team';
  clientId?: string;
  expreseCategory: string;
  description: string;
  netAmount: number;
  vatPercentage: number;
  vatAmount: number;
  totalAmount: number;
  status: 'yes' | 'no';
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  client?: {
    _id: string;
    name: string;
  };
  user?: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  submittedDetails: {
    _id: string;
    name: string;
  };
}

export interface ListExpensesResponse {
  success: boolean;
  message: string;
  data: {
    expenses: ExpenseItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
    statistics: {
      totalExpenses: number;
      totalStatusYesExpenses: number;
      totalStatusNoExpenses: number;
      totalAmount: number;
      approvedTotalAmount: number;
      pendingTotalAmount: number;
      averageExpenseAmount: number;
      maxExpenseAmount: number;
      minExpenseAmount: number;
    };
  };
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
        if (payload.clientId) {
          formData.append('clientId', payload.clientId);
        }
        if (payload.userId) {
          formData.append('userId', payload.userId);
        }
        formData.append('date', payload.date);
        formData.append('expreseCategory', payload.expreseCategory);
        formData.append('netAmount', String(payload.netAmount));
        formData.append('vatPercentage', String(payload.vatPercentage));
        if (payload.vatAmount !== undefined) {
          formData.append('vatAmount', String(payload.vatAmount));
        }
        if (payload.totalAmount !== undefined) {
          formData.append('totalAmount', String(payload.totalAmount));
        }
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
    listExpenses: builder.query<ListExpensesResponse, ListExpensesRequest>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        
        if (params.status && params.status !== 'all') {
          searchParams.append('status', params.status);
        }
        if (params.type && params.type !== 'all') {
          searchParams.append('type', params.type);
        }
        if (params.search) {
          searchParams.append('search', params.search);
        }
        if (params.page) {
          searchParams.append('page', params.page.toString());
        }
        if (params.limit) {
          searchParams.append('limit', params.limit.toString());
        }

        const queryString = searchParams.toString();
        return `all${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Expense'],
    }),
  }),
});

export const { useAddClientExpenseMutation, useListExpensesQuery } = expensesApi;


