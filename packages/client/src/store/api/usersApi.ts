import { baseApi } from './baseApi';
import type { User, ApiResponse, PaginationMeta } from '@blackbear/shared';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<{ data: User[]; meta: PaginationMeta }, Record<string, any>>({
      query: (params) => ({ url: '/users', params }),
      providesTags: ['User'],
    }),
    getUser: build.query<ApiResponse<User>, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),
    updateUser: build.mutation<ApiResponse<User>, { id: string; data: Partial<User> }>({
      query: ({ id, data }) => ({ url: `/users/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }],
    }),
    updateProfile: build.mutation<ApiResponse<User>, Partial<User>>({
      query: (data) => ({ url: '/profile', method: 'PUT', body: data }),
      invalidatesTags: ['User'],
    }),
    changePassword: build.mutation<void, { current_password: string; new_password: string }>({
      query: (body) => ({ url: '/profile/password', method: 'PUT', body }),
    }),
    getProfile: build.query<{ data: User }, void>({
      query: () => '/profile',
      providesTags: ['User'],
    }),
    createUser: build.mutation<ApiResponse<User>, { email: string; password: string; first_name: string; last_name: string; role: string }>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetUsersQuery, useGetUserQuery, useUpdateUserMutation,
  useUpdateProfileMutation, useChangePasswordMutation, useGetProfileQuery,
  useCreateUserMutation,
} = usersApi;
