import { baseApi } from './baseApi';
import type { Account, ApiResponse, PaginationMeta } from '@blackpear/shared';

export const accountsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAccounts: build.query<{ data: Account[]; meta: PaginationMeta }, Record<string, any>>({
      query: (params) => ({ url: '/accounts', params }),
      providesTags: (result) =>
        result ? [...result.data.map((a) => ({ type: 'Account' as const, id: a.id })), 'Account'] : ['Account'],
    }),
    getAccount: build.query<ApiResponse<Account>, string>({
      query: (id) => `/accounts/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Account', id }],
    }),
    createAccount: build.mutation<ApiResponse<Account>, Partial<Account>>({
      query: (body) => ({ url: '/accounts', method: 'POST', body }),
      invalidatesTags: ['Account'],
    }),
    updateAccount: build.mutation<ApiResponse<Account>, { id: string; data: Partial<Account> }>({
      query: ({ id, data }) => ({ url: `/accounts/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Account', id }, 'Dashboard'],
    }),
    deleteAccount: build.mutation<void, string>({
      query: (id) => ({ url: `/accounts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Account', 'Dashboard'],
    }),
    getTimeline: build.query<ApiResponse<any[]>, string>({
      query: (id) => `/accounts/${id}/timeline`,
      providesTags: (_r, _e, id) => [{ type: 'Activity', id }],
    }),
  }),
});

export const {
  useGetAccountsQuery, useGetAccountQuery, useCreateAccountMutation,
  useUpdateAccountMutation, useDeleteAccountMutation, useGetTimelineQuery,
} = accountsApi;
