import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface GetWipResponse {
  success: boolean;
  message: string;
  data: any[];
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
  };
  summary?: any;
}

export interface GetWipRequest {
  page?: number;
  limit?: number;
  serach?: string; // backend expects this exact key
  targetMetCondition?: '0' | '1' | '2';
  WIPWarningJobs?: boolean;
}

export const wipApi = createApi({
  reducerPath: 'wipApi',
  tagTypes: ['Invoices', 'Wip'],
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
    getWip: builder.query<GetWipResponse, GetWipRequest | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args && typeof args === 'object') {
          const { page, limit, serach, targetMetCondition, WIPWarningJobs } = args as GetWipRequest;
          if (page) params.append('page', String(page));
          if (limit) params.append('limit', String(limit));
          if (serach) params.append('serach', serach);
          if (targetMetCondition) params.append('targetMetCondition', targetMetCondition);
          if (typeof WIPWarningJobs === 'boolean') params.append('WIPWarningJobs', String(WIPWarningJobs));
        }
        const qs = params.toString();
        return { url: `/wip${qs ? `?${qs}` : ''}` };
      },
      providesTags: ['Wip'],
    }),
    getAgedWip: builder.query<any, { page?: number; limit?: number; search?: string } | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args && typeof args === 'object') {
          const { page, limit, search } = args;
          if (page) params.append('page', String(page));
          if (limit) params.append('limit', String(limit));
          if (search) params.append('search', search);
        }
        const qs = params.toString();
        return { url: `/wip/age-wip${qs ? `?${qs}` : ''}` };
      },
    }),
    getAgedDebtors: builder.query<any, { page?: number; limit?: number; startDate?: string; endDate?: string; clientId?: string } | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args && typeof args === 'object') {
          const { page, limit, startDate, endDate, clientId } = args as any;
          if (page) params.append('page', String(page));
          if (limit) params.append('limit', String(limit));
          if (startDate) params.append('startDate', startDate);
          if (endDate) params.append('endDate', endDate);
          if (clientId) params.append('clientId', clientId);
        }
        const qs = params.toString();
        return { url: `/wip/aged-debtors${qs ? `?${qs}` : ''}` };
      },
    }),
    addWipOpenBalance: builder.mutation<any, { type: 'client' | 'job'; amount: number; clientId?: string; jobId?: string; date?: string }>({
      query: (payload) => ({
        url: '/wip/open-balance',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Wip'],
    }),
    attachWipTarget: builder.mutation<any, { type: 'client' | 'job'; wipTargetId: string; clientId?: string; jobId?: string }>({
      query: (payload) => ({
        url: '/wip/attach-wip-target',
        method: 'POST',
        body: payload,
      }),
    }),
    generateInvoice: builder.mutation<any, any>({
      query: (payload) => ({
        url: '/wip/invoice/generate',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Invoices', 'Wip'],
    }),
    logInvoice: builder.mutation<any, any>({
      query: (payload) => ({
        url: '/wip/invoice',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Invoices', 'Wip'],
    }),
    createInvoiceLog: builder.mutation<any, { invoiceId: string; action: string; amount: number; date: string }>({
      query: (payload) => ({
        url: '/wip/invoice/log',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Invoices'],
    }),
    getInvoiceTimeLogs: builder.mutation<any, { timeLogIds: string[] }>({
      query: (payload) => ({
        url: '/wip/invoice/time-logs',
        method: 'POST',
        body: payload,
      }),
    }),
    updateInvoiceStatus: builder.mutation<any, { invoiceId: string; status: 'issued' | 'paid' | 'partPaid' }>({
      query: (payload) => ({
        url: '/wip/invoice/status-change',
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['Invoices'],
    }),
    getInvoices: builder.query<any, { page?: number; limit?: number; clientId?: string; status?: string; startDate?: string; endDate?: string } | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args && typeof args === 'object') {
          const { page, limit, clientId, status, startDate, endDate } = args as any;
          if (page) params.append('page', String(page));
          if (limit) params.append('limit', String(limit));
          if (clientId) params.append('clientId', clientId);
          if (status && status !== 'all-statuses') params.append('status', status);
          if (startDate) params.append('startDate', startDate);
          if (endDate) params.append('endDate', endDate);
        }
        const qs = params.toString();
        return { url: `/wip/invoices${qs ? `?${qs}` : ''}` };
      },
      providesTags: ['Invoices'],
    }),
    getInvoiceByInvoiceNo: builder.query<any, string>({
      query: (invoiceNo) => ({
        url: `/wip/invoice/invoice-no/${invoiceNo}`,
        method: 'GET',
      }),
      providesTags: ['Invoices'],
    }),
    createWriteOff: builder.mutation<any, {
      invoiceNo: string;
      amount: number;
      date: string;
      writeOffData: {
        timeLogs: Array<{
          timeLogId: string;
          writeOffAmount: number;
          writeOffPercentage: number;
          originalAmount: number;
          duration: number;
          clientId: string;
          jobId: string;
          userId: string;
          jobCategoryId: string;
        }>;
        reason: string;
        logic: 'proportionally' | 'manually';
      };
    }>({
      query: (payload) => ({
        url: '/wip/write-off',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Invoices', 'Wip'],
    }),
    getWriteOffDashboard: builder.query<any, { type: 'client' | 'job' | 'jobtype' | 'team'; page?: number; limit?: number; search?: string; startDate?: string; endDate?: string; clientId?: string; jobId?: string }>({
      query: (args) => {
        const params = new URLSearchParams();
        params.append('type', args.type);
        if (args.page) params.append('page', String(args.page));
        if (args.limit) params.append('limit', String(args.limit));
        if (args.search) params.append('search', args.search);
        if (args.startDate) params.append('startDate', args.startDate);
        if (args.endDate) params.append('endDate', args.endDate);
        if (args.clientId) params.append('clientId', args.clientId);
        if (args.jobId) params.append('jobId', args.jobId);
        const qs = params.toString();
        return { url: `/wip/write-off-dashboard${qs ? `?${qs}` : ''}` };
      },
    }),
    getWriteOff: builder.query<any, { page?: number; limit?: number; startDate?: string; endDate?: string; search?: string; clientId?: string; jobId?: string; logic?: string } | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args && typeof args === 'object') {
          const { page, limit, startDate, endDate, search, clientId, jobId, logic } = args;
          if (page) params.append('page', String(page));
          if (limit) params.append('limit', String(limit));
          if (startDate) params.append('startDate', startDate);
          if (endDate) params.append('endDate', endDate);
          if (search) params.append('search', search);
          if (clientId) params.append('clientId', clientId);
          if (jobId) params.append('jobId', jobId);
          if (logic) params.append('logic', logic);
        }
        const qs = params.toString();
        return { url: `/wip/write-off${qs ? `?${qs}` : ''}` };
      },
    }),
  }),
});

export const { useGetWipQuery, useGetAgedWipQuery, useGetAgedDebtorsQuery, useAddWipOpenBalanceMutation, useAttachWipTargetMutation, useGenerateInvoiceMutation, useLogInvoiceMutation, useGetInvoicesQuery, useUpdateInvoiceStatusMutation, useGetInvoiceByInvoiceNoQuery, useCreateWriteOffMutation, useGetWriteOffDashboardQuery, useGetWriteOffQuery, useGetInvoiceTimeLogsMutation } = wipApi;
export const { useCreateInvoiceLogMutation } = wipApi;


