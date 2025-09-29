import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
    AddTeamMemberRequest,
    AddTeamMemberResponse,
    UploadImageResponse,
    TeamMember,
    GetAllTeamMembersRequest,
    GetAllTeamMembersResponse,
    UpdateTeamMembersResponse,
    UpdateTeamMembersRequest,
    SendInviteResponse,
    SendInviteRequest,
    AddCompanyResponse,
    AddCompanyRequest,
    GetAllCompanyMembersRequest,
    GetAllCompanyMembersResponse
} from '../types/APIs/teamApiType';

export interface GetTeamMembersByCompanyRequest {
    companyId: string;
    page: number;
    limit: number;
    search?: string;
}

export interface GetTeamMembersByCompanyResponse {
    success: boolean;
    message: string;
    data: {
        teamMembers: TeamMember[];
        pagination: {
            total: number;
            totalPages: number;
        };
    };
}

export interface LoginAsGuestRequest {
    userId: string;
}

export interface LoginAsGuestResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            companyId: string;
        };
    };
}

export interface GetCompanyByIdRequest {
    companyId: string;
}

export interface GetCompanyByIdResponse {
    success: boolean;
    message: string;
    data: {
        company: {
            _id: string;
            name: string;
            email: string;
            createdAt: string;
            updatedAt: string;
        };
    };
}

type UploadImageRequest = File;

export const companiesApi = createApi({
    reducerPath: 'companiesApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_URL}/user`,
        prepareHeaders: (headers) => {
            // Check for both superAdminToken and userToken
            const superAdminToken = localStorage.getItem('superAdminToken');
            const userToken = localStorage.getItem('userToken');
            const token = superAdminToken || userToken;
            
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            headers.set('ngrok-skip-browser-warning', "69420");
            return headers;
        },
    }),
    tagTypes: ['Team', 'CompanyMembers', 'Company', 'Auth'],
    endpoints: (builder) => ({
        // --- AUTH ENDPOINTS ---
        loginAsGuest: builder.mutation<LoginAsGuestResponse, LoginAsGuestRequest>({
            query: (userId) => ({
                url: `${import.meta.env.VITE_API_URL}/auth/login-as-guest`,
                method: 'POST',
                body: userId,
                // Use superAdmin token for this specific request
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('superAdminToken') || localStorage.getItem('userToken')}`,
                },
            }),
            onQueryStarted: async (arg, { queryFulfilled }) => {
                try {
                    const { data }: any = await queryFulfilled;
                    // Store the original superAdmin token if not already stored
                    const currentUserToken = localStorage.getItem('userToken');
                    const superAdminToken = localStorage.getItem('superAdminToken');
                    // if (!superAdminToken && currentUserToken) {
                    //     localStorage.setItem('superAdminToken', currentUserToken);
                    // }
                    // // Store the guest token as userToken
                    // localStorage.setItem('userToken', data?.data?.token);
                } catch (error) {
                    console.error('Login as guest failed:', error);
                }
            },
            invalidatesTags: ['Auth'],
        }),

        // --- COMPANY MANAGEMENT ENDPOINTS ---
        getAllCompanyMembers: builder.query<GetAllCompanyMembersResponse, GetAllCompanyMembersRequest>({
            query: ({ page, limit, search }) => {
                const params = new URLSearchParams();
                params.append('page', String(page));
                params.append('limit', String(limit));
                if (search) {
                    params.append('search', search);
                }
                return {
                    url: `/get-all-company-members?${params.toString()}`
                };
            },
            providesTags: (result) => {
                const members = result?.data?.companyMembers;
                return members
                    ? [
                        ...members.map(({ _id }) => ({ type: 'CompanyMembers' as const, id: _id })),
                        { type: 'CompanyMembers', id: 'LIST' },
                    ]
                    : [{ type: 'CompanyMembers', id: 'LIST' }];
            },
        }),

        getCompanyById: builder.query<GetCompanyByIdResponse, GetCompanyByIdRequest>({
            query: ({ companyId }) => `/get-all-company-members/${companyId}`,
            providesTags: (result, error, { companyId }) => [{ type: 'Company', id: companyId }],
        }),

        getTeamMembersByCompanyId: builder.query<GetTeamMembersByCompanyResponse, GetTeamMembersByCompanyRequest>({
            query: ({ companyId, page, limit, search }) => {
                const params = new URLSearchParams();
                params.append('page', String(page));
                params.append('limit', String(limit));
                if (search) {
                    params.append('search', search);
                }
                return {
                    url: `/get-all-company-members/${companyId}/team-members?${params.toString()}`
                };
            },
            providesTags: (result, error, { companyId }) => {
                const members = result?.data?.teamMembers;
                const companyTeamTag = { type: 'Team' as const, id: `LIST_COMPANY_${companyId}` };
                return members
                    ? [
                        ...members.map(({ _id }) => ({ type: 'Team' as const, id: _id })),
                        companyTeamTag,
                    ]
                    : [companyTeamTag];
            },
        }),

        addCompany: builder.mutation<AddCompanyResponse, AddCompanyRequest>({
            query: (newCompany) => ({
                url: '/add-company',
                method: 'POST',
                body: newCompany,
            }),
            invalidatesTags: ['Company', { type: 'CompanyMembers', id: 'LIST' }],
        }),

        // --- TEAM MANAGEMENT ENDPOINTS (for company access) ---
        getAllTeamMembers: builder.query<GetAllTeamMembersResponse, GetAllTeamMembersRequest>({
            query: ({ page, limit, search, departmentType }) => {
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

        updateTeamMembers: builder.mutation<UpdateTeamMembersResponse, any>({
            query: (updateData) => ({
                url: '/update-team-members',
                method: 'POST',
                body: updateData,
            }),
            invalidatesTags: [{ type: 'Team', id: 'LIST' }, { type: 'CompanyMembers', id: 'LIST' }],
        }),

        addTeamMember: builder.mutation<AddTeamMemberResponse, AddTeamMemberRequest>({
            query: (newMember) => ({
                url: '/add-team-member',
                method: 'POST',
                body: newMember,
            }),
            invalidatesTags: ['Team', { type: 'CompanyMembers', id: 'LIST' }],
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
        }),
    }),
});

export const {
    useLoginAsGuestMutation,
    useGetAllCompanyMembersQuery,
    useGetCompanyByIdQuery,
    useGetTeamMembersByCompanyIdQuery,
    useAddCompanyMutation,
    useGetAllTeamMembersQuery,
    useUpdateTeamMembersMutation,
    useAddTeamMemberMutation,
    useUploadImageMutation,
    useSendInviteToTeamMemberMutation,
    useGetDropdownOptionsQuery,
} = companiesApi;
