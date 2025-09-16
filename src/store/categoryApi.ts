import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { addCategoryRequest, DeleteCategoryRequest } from '../types/APIs/categoryApiType';



export const categoryApi = createApi({
    reducerPath: 'categoryApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_URL}/category`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('userToken');
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
          headers.set('ngrok-skip-browser-warning', "69420");

            return headers;
        },
    }),
    tagTypes: ['Auth'],
    endpoints: (builder) => ({
        addCategory: builder.mutation<any, addCategoryRequest>({
            query: (credentials) => ({
                url: '/',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['Auth'],
        }),

        getAllCategorieas: builder.query({
            query: (all) => '/?type=' + all,
            providesTags: ['Auth'],
        }),

        deleteCategory: builder.mutation<any, DeleteCategoryRequest>({
            query: ({ type, id }) => ({
                url: '/',
                method: 'DELETE',
                body: { type, id },
            }),
            invalidatesTags: ['Auth'],
        }),

    }),
});

export const {
    useAddCategoryMutation,
    useGetAllCategorieasQuery,
    useDeleteCategoryMutation
} = categoryApi;
