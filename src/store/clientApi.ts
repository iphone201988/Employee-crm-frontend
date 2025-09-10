import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const clientApi = createApi({
    reducerPath: 'clientApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_URL}/client`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('userToken');
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Client'],
    endpoints: (builder) => ({
        addClient: builder.mutation<IAddClientResponse, ClientData>({
            query: (body: ClientData) => ({
                url: '/add',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Client'],
        }),
        getClients: builder.query<GetClientsResponse, any>({
            query: ({page,limit}) => ({
                url: '/all?page='+page+'&limit='+limit,
                method: 'GET'
            }),
            providesTags: ['Client'],
        })
    }),
});

export const { useAddClientMutation, useGetClientsQuery } = clientApi;
