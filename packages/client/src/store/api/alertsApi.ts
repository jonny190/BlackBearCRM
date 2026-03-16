import { baseApi } from './baseApi';

export const alertsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAlerts: build.query<{ data: { alerts: any[]; unread_count: number } }, void>({
      query: () => '/alerts',
      providesTags: ['Alert'],
    }),
    markRead: build.mutation<void, string>({
      query: (id) => ({ url: `/alerts/${id}/read`, method: 'PUT' }),
      invalidatesTags: ['Alert'],
    }),
    dismissAlert: build.mutation<void, string>({
      query: (id) => ({ url: `/alerts/${id}/dismiss`, method: 'PUT' }),
      invalidatesTags: ['Alert'],
    }),
  }),
});

export const { useGetAlertsQuery, useMarkReadMutation, useDismissAlertMutation } = alertsApi;
