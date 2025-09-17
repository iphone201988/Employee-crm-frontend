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
            headers.set('ngrok-skip-browser-warning', "69420");

            return headers;
        },
    }),
    tagTypes: ['Client', 'ClientServices'],
    endpoints: (builder) => ({
        addClient: builder.mutation<IAddClientResponse, ClientData>({
            query: (body: ClientData) => ({
                url: '/add',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Client', 'ClientServices'],
        }),
        getClients: builder.query<GetClientsResponse, any>({
            query: ({ page, limit }) => ({
                url: `/all?page=${page}&limit=${limit}`,
                method: 'GET'
            }),
            providesTags: ['Client'],
        }),

        getClientServices: builder.query<GetClientServicesResponse, GetClientServicesRequest>({
            query: ({ page, limit, search, businessType }) => {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                });
                if (search) {
                    params.append('search', search);
                }
                if (businessType) {
                    params.append('businessType', businessType);
                }
                return {
                    url: `/services?${params.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: (result) => {
                const services = result?.data;
                return services
                    ? [
                        ...services.map(({ _id }) => ({ type: 'ClientServices' as const, id: _id })),
                        { type: 'ClientServices', id: 'LIST' },
                    ]
                    : [{ type: 'ClientServices', id: 'LIST' }];
            },
        }),
        updateClientServices: builder.mutation<any, UpdateClientServicesRequest>({
            query: (body) => ({
                url: '/update-client-services',
                method: 'PUT',
                body,
            }),
            // Invalidate the list of client services to trigger a refetch
            invalidatesTags: [{ type: 'ClientServices', id: 'LIST' }],
        }),
        updateClient: builder.mutation<any, any>({
            query: ({ clientId, ...body }) => ({
                url: `/update/${clientId}`,
                method: 'PUT',
                body,
            }),
            // Invalidate the specific client and the list to trigger a refetch
            invalidatesTags: (result, error, { clientId }) => ["Client"],
        }),
        getClient: builder.query<GetClientResponse, string>({
            query: (clientId) => ({
                url: `/${clientId}`,
                method: 'GET',
            }),
            providesTags: (result, error, clientId) => [{ type: 'Client', id: clientId }],
        }),
    }),
});


export const {
    useAddClientMutation,
    useGetClientsQuery,
    useGetClientServicesQuery,
    useUpdateClientServicesMutation,
    useUpdateClientMutation,
    useGetClientQuery
} = clientApi;

