import { baseApi } from './baseApi';

export const healthApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAccountHealth: build.query<{ data: any }, string>({
      query: (id) => `/accounts/${id}/health`,
      providesTags: (_r, _e, id) => [{ type: 'Health', id }],
    }),
    getHealthHistory: build.query<{ data: any[] }, string>({
      query: (id) => `/accounts/${id}/health/history`,
      providesTags: (_r, _e, id) => [{ type: 'Health', id }],
    }),
    getHealthConfig: build.query<{ data: any[] }, void>({
      query: () => '/health/config',
    }),
    updateHealthConfig: build.mutation<{ data: any }, { tier: string; data: any }>({
      query: ({ tier, data }) => ({ url: '/health/config', method: 'PUT', body: { tier, ...data } }),
      invalidatesTags: ['Health'],
    }),
  }),
});

export const {
  useGetAccountHealthQuery, useGetHealthHistoryQuery,
  useGetHealthConfigQuery, useUpdateHealthConfigMutation,
} = healthApi;
