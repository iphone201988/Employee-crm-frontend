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
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
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
}

export interface GetTimesheetRequest {
  weekStart: string;
  weekEnd: string;
  userId?: string;
}

export interface AddTimesheetRequest {
  weekStart: string;
  weekEnd: string;
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
}

export interface UpdateTimesheetRequest {
  timesheetId: string;
  timeEntries: Array<{
    _id?: string;
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
      query: ({ weekStart, weekEnd, userId }) => ({
        url: '/',
        params: { 
          // Ensure UTC ISO format
          weekStart: weekStart, 
          weekEnd: new Date(weekEnd).toISOString(), 
          userId 
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
    
    updateTimesheet: builder.mutation<{ success: boolean; message: string; data: any }, UpdateTimesheetRequest>({
      query: ({ timesheetId, timeEntries }) => ({
        url: `/update/${timesheetId}`,
        method: 'PUT',
        body: { timeEntries },
      }),
      invalidatesTags: (result, error, { timesheetId }) => [
        { type: 'Timesheet', id: timesheetId },
        'TimeEntry',
      ],
    }),
  }),
});

export const {
  useGetTimesheetQuery,
  useLazyGetTimesheetQuery,
  useAddTimesheetMutation,
  useUpdateTimesheetMutation,
} = timesheetApi;
