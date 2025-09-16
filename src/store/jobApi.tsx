import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';


interface PopulatedUser {
    _id: string;
    name: string;
    email: string;
}

interface PopulatedJobType {
    _id: string;
    name: string;
}

export interface Job {
    _id: string;
    name: string;
    clientId: PopulatedUser;
    jobTypeId: PopulatedJobType;
    jobManagerId: PopulatedUser;
    startDate: string;
    endDate: string;
    jobCost: number;
    teamMembers: PopulatedUser[];
    status: 'queued' | 'inProgress' | 'withClient' | 'forApproval' | 'completed' | 'cancelled';
    description: string;
    createdBy: PopulatedUser;
    priority: 'high' | 'medium' | 'low' | 'urgent';
    createdAt: string;
    updatedAt: string;
    __v: number;
}

// --- Request Type for Creating/Updating a Job ---
export type JobMutationRequest = {
    name: string;
    description: string;
    clientId: string;
    jobTypeId: string;
    jobManagerId: string;
    startDate: string;
    endDate: string;
    jobCost: number;
    teamMembers: string[];
    status: 'queued' | 'inProgress' | 'withClient' | 'forApproval' | 'completed' | 'cancelled';
    priority: 'high' | 'medium' | 'low' | 'urgent';
};

// --- Response Types for Mutations ---
export interface CreateJobResponse {
  success: boolean;
  message: string;
  data: Job;
}

export interface UpdateJobResponse {
  success: boolean;
  message: string;
  data: Job;
}

export interface DeleteJobResponse {
    success: boolean;
    message: string;
}

// --- Request Type for 'getJobs' Query ---
export interface GetJobsRequest {
    page: number;
    limit: number;
    status?: string;
    priority?: string;
    search?: string;
    view?: string;
}

// --- Interfaces for the 'getJobs' Response Data ---
interface Pagination {
    currentPage: number;
    totalPages: number;
    totalJobs: number;
    limit: number;
}
interface StatusBreakdown { [key: string]: number; }
interface TeamMemberStat {
    _id: string;
    totalJobs: number;
    userName: string;
    userEmail: string;
    jobTypesWithCount: Array<{ name: string; _id: string; count: number }>;
    statusBreakdown: StatusBreakdown;
}
interface Distribution {
    _id: string;
    count: number;
    totalFee: number;
    avgWIP: number | null;
    wipPercentage: number;
    managerId?: string;
}

export interface GetJobsResponse {
    success: boolean;
    message: string;
    data: {
        jobs: Job[];
        pagination: Pagination;
        statusBreakdown: StatusBreakdown;
        teamMemberStats: TeamMemberStat[];
        statusDistribution: Distribution[];
        jobManagerDistribution: Distribution[];
        wipFeeDistribution: Distribution[];
        filters: {
            currentView: string;
            currentStatus: string;
            currentPriority: string;
        };
    };
}

// --- API Slice Definition ---
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
    // Endpoint to create a new job
    createJob: builder.mutation<CreateJobResponse, Partial<JobMutationRequest>>({
      query: (newJobData) => ({
        url: '/create',
        method: 'POST',
        body: newJobData,
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }],
    }),

    // Endpoint to get all jobs with filters
    getJobs: builder.query<GetJobsResponse, GetJobsRequest>({
        query: ({ page, limit, status, priority, search, view }) => {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
                view: view || 'yearly', 
            });
            if (status) params.append('status', status);
            if (priority) params.append('priority', priority);
            if (search) params.append('search', search);
            return { url: `/all?${params.toString()}` };
        },
        providesTags: (result) => result?.data?.jobs
            ? [
                { type: 'Job', id: 'LIST' },
                ...result.data.jobs.map(({ _id }) => ({ type: 'Job' as const, id: _id })),
              ]
            : [{ type: 'Job', id: 'LIST' }],
    }),

    // Endpoint to update a job
    updateJob: builder.mutation<UpdateJobResponse, { jobId: string; jobData: Partial<JobMutationRequest> }>({
      query: ({ jobId, jobData }) => ({
        url: `/update-job/${jobId}`,
        method: 'PUT',
        body: jobData,
      }),
      invalidatesTags: (result, error, { jobId }) => [
          { type: 'Job', id: 'LIST' },
          { type: 'Job', id: jobId }
      ],
    }),

    // --- New Endpoint to Delete a Job ---
    deleteJob: builder.mutation<DeleteJobResponse, string>({
        query: (jobId) => ({
            url: `/delete-job/${jobId}`,
            method: 'DELETE',
        }),
        invalidatesTags: [{ type: 'Job', id: 'LIST' }],
    }),
  }),
});

// --- Export Hooks ---
export const {
  useCreateJobMutation,
  useGetJobsQuery,
  useUpdateJobMutation,
  useDeleteJobMutation, // Export the new hook
} = jobApi;
