import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Note {
  _id: string;
  note: string;
  timesheetId?: string;
  clientId?: string;
  jobId?: string;
  createdBy: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AddNoteRequest {
  note: string;
  timesheetId?: string;
  clientId?: string;
  jobId?: string;
}

export interface UpdateNoteRequest {
  note: string;
}

export interface GetNotesResponse {
  success: boolean;
  message: string;
  data: Note[];
}

export interface AddNoteResponse {
  success: boolean;
  message: string;
  data: Note;
}

export const notesApi = createApi({
  reducerPath: 'notesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/note`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('userToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('ngrok-skip-browser-warning', '69420');
      return headers;
    },
  }),
  tagTypes: ['Note'],
  endpoints: (builder) => ({
    getNotes: builder.query<GetNotesResponse, { timesheetId?: string; clientId?: string; jobId?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.timesheetId) queryParams.append('timesheetId', params.timesheetId);
        if (params.clientId) queryParams.append('clientId', params.clientId);
        if (params.jobId) queryParams.append('jobId', params.jobId);
        return {
          url: `/?${queryParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, arg) => [
        { type: 'Note' as const, id: arg.clientId || arg.timesheetId || arg.jobId || 'LIST' },
      ],
    }),
    addNote: builder.mutation<AddNoteResponse, AddNoteRequest>({
      query: (body) => ({
        url: '/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Note' as const, id: arg.clientId || arg.timesheetId || arg.jobId || 'LIST' },
        'Note',
      ],
    }),
    updateNote: builder.mutation<AddNoteResponse, { noteId: string; note: string }>({
      query: ({ noteId, note }) => ({
        url: `/update/${noteId}`,
        method: 'PUT',
        body: { note },
      }),
      invalidatesTags: ['Note'],
    }),
    deleteNote: builder.mutation<void, string>({
      query: (noteId) => ({
        url: `/delete/${noteId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Note'],
    }),
  }),
});

export const {
  useGetNotesQuery,
  useAddNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = notesApi;

