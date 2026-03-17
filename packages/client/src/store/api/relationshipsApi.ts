import { baseApi } from './baseApi';

export const relationshipsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRelationships: build.query<{ data: any[] }, string>({
      query: (accountId) => `/accounts/${accountId}/relationships`,
      providesTags: ['Relationship'],
    }),
    createRelationship: build.mutation<any, { accountId: string; data: any }>({
      query: ({ accountId, data }) => ({ url: `/accounts/${accountId}/relationships`, method: 'POST', body: data }),
      invalidatesTags: ['Relationship'],
    }),
    updateRelationship: build.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/relationships/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Relationship'],
    }),
    deleteRelationship: build.mutation<void, string>({
      query: (id) => ({ url: `/relationships/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Relationship'],
    }),
  }),
});

export const {
  useGetRelationshipsQuery,
  useCreateRelationshipMutation,
  useUpdateRelationshipMutation,
  useDeleteRelationshipMutation,
} = relationshipsApi;
