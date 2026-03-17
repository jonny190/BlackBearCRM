import { baseApi } from './baseApi';

export const integrationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getIntegrationSettings: build.query<{ data: any }, void>({
      query: () => '/integrations/settings',
      providesTags: ['Integration'],
    }),
    updateIntegrationSettings: build.mutation<{ data: any }, any>({
      query: (body) => ({ url: '/integrations/settings', method: 'PUT', body }),
      invalidatesTags: ['Integration'],
    }),
    getConnectionStatus: build.query<{ data: { connected: boolean; connected_at?: string; scopes?: string[] } }, void>({
      query: () => '/integrations/status',
      providesTags: ['Integration'],
    }),
    connectM365: build.mutation<{ data: { auth_url: string } }, void>({
      query: () => ({ url: '/integrations/connect', method: 'POST' }),
    }),
    disconnectM365: build.mutation<void, void>({
      query: () => ({ url: '/integrations/disconnect', method: 'POST' }),
      invalidatesTags: ['Integration'],
    }),
    getEmails: build.query<{ data: any[] }, void>({
      query: () => '/integrations/emails',
    }),
    getCalendarEvents: build.query<{ data: any[] }, number | void>({
      query: (days) => `/integrations/calendar?days=${days || 7}`,
    }),
  }),
});

export const {
  useGetIntegrationSettingsQuery,
  useUpdateIntegrationSettingsMutation,
  useGetConnectionStatusQuery,
  useConnectM365Mutation,
  useDisconnectM365Mutation,
  useGetEmailsQuery,
  useGetCalendarEventsQuery,
} = integrationsApi;
