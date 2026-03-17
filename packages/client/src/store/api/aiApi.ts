import { baseApi } from './baseApi';

export const aiApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAiSettings: build.query<{ data: any }, void>({
      query: () => '/ai/settings',
      providesTags: ['AiSettings'],
    }),
    updateAiSettings: build.mutation<{ data: any }, any>({
      query: (body) => ({ url: '/ai/settings', method: 'PUT', body }),
      invalidatesTags: ['AiSettings'],
    }),
    testAiConnection: build.mutation<{ data: { success: boolean; message: string } }, void>({
      query: () => ({ url: '/ai/test', method: 'POST' }),
    }),
    generateBriefing: build.mutation<{ data: any }, { accountId: string; type: string }>({
      query: ({ accountId, type }) => ({ url: `/accounts/${accountId}/briefing`, method: 'POST', body: { type } }),
    }),
    getBriefings: build.query<{ data: any[] }, string>({
      query: (accountId) => `/accounts/${accountId}/briefings`,
    }),
  }),
});

export const {
  useGetAiSettingsQuery,
  useUpdateAiSettingsMutation,
  useTestAiConnectionMutation,
  useGenerateBriefingMutation,
  useGetBriefingsQuery,
} = aiApi;
