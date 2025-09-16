import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { AddTeamMemberRequest, AddTeamMemberResponse, UploadImageResponse, TeamMember, GetAllTeamMembersRequest, GetAllTeamMembersResponse, UpdateTeamMembersResponse, UpdateTeamMembersRequest, SendInviteResponse, SendInviteRequest } from '../types/APIs/teamApiType';


type UploadImageRequest = File;
export const teamApi = createApi({
    reducerPath: 'teamApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_URL}/user`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('userToken');
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            headers.set('ngrok-skip-browser-warning', "69420");

            return headers;
        },
    }),
    tagTypes: ['Team'],
    endpoints: (builder) => ({
        getAllTeamMembers: builder.query<GetAllTeamMembersResponse, GetAllTeamMembersRequest>({
            query: ({ page, limit, search, departmentType }) => {
                // Build the query parameters dynamically
                const params = new URLSearchParams();
                params.append('page', String(page));
                params.append('limit', String(limit));
                if (search) {
                    params.append('search', search);
                }
                if (departmentType && departmentType !== 'all') {
                    params.append('departmentId', departmentType);
                }

                return {
                    url: `/get-all-team-members?${params.toString()}`
                };
            },
            providesTags: (result) => {
                const teamMembers = result?.data?.teamMembers;
                return teamMembers
                    ? [
                        ...teamMembers.map(({ _id }) => ({ type: 'Team' as const, id: _id })),
                        { type: 'Team', id: 'LIST' },
                    ]
                    : [{ type: 'Team', id: 'LIST' }];
            },
        }),
        updateTeamMembers: builder.mutation<UpdateTeamMembersResponse, UpdateTeamMembersRequest>({
            query: (updateData) => ({
                url: '/update-team-members',
                method: 'POST',
                body: updateData,
            }),
            invalidatesTags: [{ type: 'Team', id: 'LIST' }],
        }),
        addTeamMember: builder.mutation<AddTeamMemberResponse, AddTeamMemberRequest>({
            query: (newMember) => ({
                url: '/add-team-member',
                method: 'POST',
                body: newMember,
            }),
            invalidatesTags: ['Team'],
        }),
        uploadImage: builder.mutation<UploadImageResponse, UploadImageRequest>({
            query: (imageFile) => {
                const formData = new FormData();
                formData.append('file', imageFile);

                return {
                    url: '/upload-image',
                    method: 'POST',
                    body: formData,

                    headers: {
                        'Content-Type': undefined,
                    },
                };
            },

        }),
        sendInviteToTeamMember: builder.mutation<SendInviteResponse, SendInviteRequest>({
            query: (inviteData) => ({
                url: '/send-invite-to-team-member',
                method: 'POST',
                body: inviteData,
            }),
        }),
        getDropdownOptions: builder.query<any, any>({
            query: (type) => '/dropdown-options?type=' + type,
        })
    }),
});

export const {
    useAddTeamMemberMutation,
    useUploadImageMutation,
    useGetAllTeamMembersQuery,
    useUpdateTeamMembersMutation,
    useSendInviteToTeamMemberMutation,
    useGetDropdownOptionsQuery
} = teamApi;
