import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Types for the API responses
export interface TimeLog {
  _id: string;
  date: string;
  duration: number; // in minutes
}

export interface TimeEntry {
  _id: string;
  timeCategoryId: string;
  clientId: string;
  timesheetId: string;
  jobId: string;
  companyId: string;
  createdAt: string;
  description: string;
  isbillable: boolean;
  logs: TimeLog[];
  rate: number;
  totalAmount: number;
  totalHours: number;
  updatedAt: string;
  userId: string;
}

export interface DailySummary {
  date: string;
  billable: number; // in minutes
  nonBillable: number; // in minutes
  totalLogged: number; // in minutes
  capacity: number; // in minutes
  variance: number; // in minutes
  _id: string;
}

export interface TimesheetData {
  _id: string;
  userId: string;
  companyId: string;
  weekStart: string;
  weekEnd: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reviewed' | 'Auto Approved';
  timeEntries: TimeEntry[];
  dailySummary: DailySummary[];
  totalBillable: number; // in minutes
  totalNonBillable: number; // in minutes
  totalLogged: number; // in minutes
  totalCapacity: number; // in minutes
  totalVariance: number; // in minutes
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface DropdownOptionals {
  clients: Array<{
    _id: string;
    clientRef: string;
    name: string;
  }>;
  jobs: Array<{
    _id: string;
    name: string;
    clientId: string;
  }>;
  jobCategories: Array<{
    _id: string;
    name: string;
  }>;
}

export interface GetTimesheetResponse {
  success: boolean;
  message: string;
  data: TimesheetData;
  dropdoenOptionals: DropdownOptionals;
  billableRate: number;
  // Additional metadata sometimes returned by backend
  name?: string;
  avatarUrl?: string;
  rate?: number;
}

export interface GetTimesheetRequest {
  weekStart: string;
  weekEnd: string;
  userId?: string;
  timesheetId?: string;
}

export interface AddTimeLogRequest {
  date: string; // ISO
  status: 'notInvoiced' | 'invoiced' | 'paid';
  clientId: string;
  jobId: string;
  jobTypeId: string;
  timeCategoryId: string;
  description: string;
  billable: boolean;
  rate: number;
  userId: string;
  duration: number; // seconds
}

export interface AddTimesheetRequest {
  weekStart: string;
  weekEnd: string;
  status: TimesheetData['status'];
  timeEntries: Array<{
    clientId: string;
    jobId: string;
    timeCategoryId: string;
    description: string;
    isbillable: boolean;
    rate?: number;
    logs: Array<{
      date: string;
      duration: number; // in minutes
    }>;
  }>;
  dailySummary: Array<{
    date: string;
    billable: number;
    nonBillable: number;
    totalLogged: number;
    capacity: number;
    variance: number;
  }>;
  totalBillable: number;
  totalNonBillable: number;
  totalLogged: number;
  totalCapacity: number;
  totalVariance: number;
}

// Removed UpdateTimesheetRequest as update endpoint is no longer supported

export interface ListTimeLogsRequest {
  search?: string;
  page?: number;
  limit?: number;
  clientId?: string;
  jobId?: string;
  jobTypeId?: string;
  userId?: string;
  timeCategoryId?: string;
  billable?: boolean;
  status?: 'notInvoiced' | 'invoiced' | 'paid';
  dateFrom?: string; // ISO or YYYY-MM-DD
  dateTo?: string;   // ISO or YYYY-MM-DD
}

export interface DeleteTimeLogsRequest {
  timeLogIds: string[];
}

export interface UpdateTimeLogRequest {
  date: string; // ISO
  status: 'notInvoiced' | 'invoiced' | 'paid';
  clientId: string;
  jobId: string;
  jobTypeId: string;
  timeCategoryId: string;
  description: string;
  billable: boolean;
  rate: number;
  userId: string;
  duration: number; // seconds
}

export interface ListedTimeLogItem {
  _id: string;
  date: string;
  description: string;
  billable: boolean | null;
  duration: number; // seconds
  rate: number;
  amount?: number;
  status?: 'notInvoiced' | 'invoiced' | 'paid';
  client?: { _id: string; clientRef?: string; name: string };
  job?: { _id: string; name: string; jobTypeId?: string };
  jobCategory?: { _id: string; name: string };
  timeCategory?: { _id: string; name: string };
  user?: { _id: string; name: string };
}

export interface ListTimeLogsResponse {
  success: boolean;
  message: string;
  timeLogs: ListedTimeLogItem[];
  summary?: {
    totalHours?: number;
    totalAmount?: number;
    uniqueClients?: number;
    uniqueJobs?: number;
    totalLogs?: number;
    billableHours?: number;
    nonBillableHours?: number;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
}

export interface ChangeTimesheetStatusRequest {
  status: 'reviewed' | 'draft' | 'approved' | 'rejected';
  timeSheetId: string;
}

export const timesheetApi = createApi({
  reducerPath: 'timesheetApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/timesheet`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('userToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('ngrok-skip-browser-warning', '69420');
      return headers;
    },
  }),
  tagTypes: ['Timesheet', 'TimeEntry'],
  endpoints: (builder) => ({
    getTimesheet: builder.query<GetTimesheetResponse, GetTimesheetRequest>({
      query: ({ weekStart, weekEnd, userId, timesheetId }) => ({
        url: '/',
        params: { 
          // Use weekEnd as-is since it's already in ISO format from getCurrentWeekRange
          weekStart: weekStart, 
          weekEnd: weekEnd, 
          userId,
          timesheetId
        },
      }),
      providesTags: (result, error, { weekStart, weekEnd }) => [
        { type: 'Timesheet', id: `${weekStart}-${weekEnd}` },
      ],
    }),
    
    addTimesheet: builder.mutation<{ success: boolean; message: string; data: any }, AddTimesheetRequest>({
      query: (timesheetData) => ({
        url: '/add',
        method: 'POST',
        body: {
          ...timesheetData,
          // Normalize to UTC ISO
          weekStart: new Date(timesheetData.weekStart).toISOString(),
          weekEnd: new Date(timesheetData.weekEnd).toISOString(),
        },
      }),
      invalidatesTags: ['Timesheet'],
    }),
    addTimeLog: builder.mutation<{ success: boolean; message: string; data: any }, AddTimeLogRequest>({
      query: (body) => ({
        url: '/add-time-log',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Timesheet', 'TimeEntry'],
    }),
    deleteTimeLogs: builder.mutation<{ success: boolean; message: string }, DeleteTimeLogsRequest>({
      query: (body) => ({
        url: '/delete-time-log',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: ['TimeEntry'],
    }),
    updateTimeLog: builder.mutation<{ success: boolean; message: string }, { id: string; data: UpdateTimeLogRequest }>({
      query: ({ id, data }) => ({
        url: `/update-time-log/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['TimeEntry'],
    }),
    changeTimesheetStatus: builder.mutation<{ success: boolean; message: string }, ChangeTimesheetStatusRequest>({
      query: (body) => ({
        url: '/change-time-sheet-status',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Timesheet'],
    }),
    listTimeLogs: builder.query<ListTimeLogsResponse, ListTimeLogsRequest | void>({
      query: (args) => {
        const params = new URLSearchParams();
        const a = (args || {}) as ListTimeLogsRequest;
        if (a.search) params.set('search', a.search);
        if (a.page) params.set('page', String(a.page));
        if (a.limit) params.set('limit', String(a.limit));
        if (a.clientId) params.set('clientId', a.clientId);
        if (a.jobId) params.set('jobId', a.jobId);
        if (a.jobTypeId) params.set('jobTypeId', a.jobTypeId);
        if (a.userId) params.set('userId', a.userId);
        if (a.timeCategoryId) params.set('timeCategoryId', a.timeCategoryId);
        if (typeof a.billable === 'boolean') params.set('billable', String(a.billable));
        if (a.status) params.set('status', a.status);
        if (a.dateFrom) params.set('dateFrom', a.dateFrom);
        if (a.dateTo) params.set('dateTo', a.dateTo);
        const qs = params.toString();
        return {
          url: `/logs${qs ? `?${qs}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['TimeEntry'],
    }),
    
    // updateTimesheet endpoint removed
  }),
});

export const {
  useGetTimesheetQuery,
  useLazyGetTimesheetQuery,
  useAddTimesheetMutation,
  useAddTimeLogMutation,
  useListTimeLogsQuery,
  useDeleteTimeLogsMutation,
  useUpdateTimeLogMutation,
  useChangeTimesheetStatusMutation,
} = timesheetApi;
