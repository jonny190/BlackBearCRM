import { baseApi } from './baseApi';
import type { Contact, ApiResponse, PaginationMeta } from '@blackpear/shared';

export const contactsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAccountContacts: build.query<{ data: Contact[]; meta: PaginationMeta }, { accountId: string; params?: any }>({
      query: ({ accountId, params }) => ({ url: `/accounts/${accountId}/contacts`, params }),
      providesTags: ['Contact'],
    }),
    searchContacts: build.query<{ data: Contact[]; meta: PaginationMeta }, Record<string, any>>({
      query: (params) => ({ url: '/contacts', params }),
      providesTags: ['Contact'],
    }),
    createContact: build.mutation<ApiResponse<Contact>, { accountId: string; data: Partial<Contact> }>({
      query: ({ accountId, data }) => ({ url: `/accounts/${accountId}/contacts`, method: 'POST', body: data }),
      invalidatesTags: ['Contact', 'Alert'],
    }),
    updateContact: build.mutation<ApiResponse<Contact>, { id: string; data: Partial<Contact> }>({
      query: ({ id, data }) => ({ url: `/contacts/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Contact'],
    }),
    deleteContact: build.mutation<void, string>({
      query: (id) => ({ url: `/contacts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Contact', 'Alert'],
    }),
  }),
});

export const {
  useGetAccountContactsQuery, useSearchContactsQuery, useCreateContactMutation,
  useUpdateContactMutation, useDeleteContactMutation,
} = contactsApi;
