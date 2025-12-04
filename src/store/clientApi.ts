import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface GetClientsRequest {
    page: number;
    limit: number;
    search?: string;
    businessTypeIds?: string[];
    statuses?: string[];
    audit?: string[];
    aml?: string[];
    yearEnds?: string[];
}

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
        getClientBreakdown: builder.query<any, { page: number; limit: number }>({
            query: ({ page, limit }) => ({
                url: `/breakdown?page=${page}&limit=${limit}`,
                method: 'GET',
            }),
            providesTags: ['Client'],
        }),
        addClient: builder.mutation<IAddClientResponse, ClientData>({
            query: (body: ClientData) => ({
                url: '/add',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Client', 'ClientServices'],
        }),
        getClients: builder.query<GetClientsResponse, GetClientsRequest>({
            query: ({ page, limit, search, businessTypeIds, statuses, audit, aml, yearEnds }) => {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                });

                if (search && search.trim()) {
                    params.append('search', search.trim());
                }

                const appendArrayParam = (key: string, values?: string[]) => {
                    if (values && values.length > 0) {
                        params.append(key, values.join(','));
                    }
                };

                appendArrayParam('businessTypeIds', businessTypeIds);
                appendArrayParam('statuses', statuses);
                appendArrayParam('audit', audit);
                appendArrayParam('aml', aml);
                appendArrayParam('yearEnds', yearEnds);

                return {
                    url: `/all?${params.toString()}`,
                    method: 'GET'
                };
            },
            providesTags: ['Client'],
        }),

        getClientServices: builder.query<GetClientServicesResponse, GetClientServicesRequest>({
            query: ({ page, limit, search, businessTypeId, businessTypeIds }) => {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                });
                if (search) {
                    params.append('search', search);
                }
                if (businessTypeIds && businessTypeIds.length > 0) {
                    params.append('businessTypeIds', businessTypeIds.join(','));
                }
                if (businessTypeId) {
                    params.append('businessTypeId', businessTypeId);
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
            invalidatesTags: ['Client'],
        }),
        updateClientAgingDates: builder.mutation<any, { clientId: string; importedWipDate?: string | null; debtorsDate?: string | null; wipBalance?: number | null; debtorsBalance?: number | null }>({
            query: ({ clientId, ...body }) => ({
                url: `/${clientId}/aging-dates`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Client', 'Wip'],
        }),
        getClient: builder.query<GetClientResponse, string>({
            query: (clientId) => ({
                url: `/${clientId}`,
                method: 'GET',
            }),
            providesTags: (result, error, clientId) => [{ type: 'Client', id: clientId }],
        }),
        getClientDebtorsLog: builder.query<any, string>({
            query: (clientId) => ({
                url: `/${clientId}/debtors-log`,
                method: 'GET',
            }),
            providesTags: (result, error, clientId) => [{ type: 'Client', id: clientId }, { type: 'Client', id: 'DEBTORS_LOG' }],
        }),
        createDebtorsOpenBalance: builder.mutation<any, {
            clientId: string;
            amount: number;
            jobId?: string;
            type?: 'debit' | 'credit' | 'adjustment';
            date?: string;
            referenceNumber?: string;
            notes?: string;
        }>({
            query: (body) => ({
                url: `/${body.clientId}/debtors-open-balance`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { clientId }) => [
                { type: 'Client', id: clientId },
                { type: 'Client', id: 'DEBTORS_LOG' },
                'Wip', // Also invalidate WIP to refresh aged debtors
            ],
        }),
        deleteClient: builder.mutation<void, string>({
            query: (clientId) => ({
                url: `/${clientId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Client'],
        }),
        importClients: builder.mutation<any, { clients: any[] }>({
            query: (body) => ({
                url: '/import',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Client'],
        }),
    }),
});


export const {
    useAddClientMutation,
    useGetClientsQuery,
    useGetClientBreakdownQuery,
    useGetClientServicesQuery,
    useUpdateClientServicesMutation,
    useUpdateClientMutation,
    useUpdateClientAgingDatesMutation,
    useGetClientQuery,
    useDeleteClientMutation,
    useImportClientsMutation,
    useGetClientDebtorsLogQuery,
    useCreateDebtorsOpenBalanceMutation
} = clientApi;

