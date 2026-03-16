import { baseApi } from './baseApi';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getManagerDashboard: build.query<{ data: any }, void>({
      query: () => '/dashboard/manager',
      providesTags: ['Dashboard'],
    }),
    getTeamLeadDashboard: build.query<{ data: any }, void>({
      query: () => '/dashboard/team-lead',
      providesTags: ['Dashboard'],
    }),
    getOperationsDashboard: build.query<{ data: any }, void>({
      query: () => '/dashboard/operations',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetManagerDashboardQuery, useGetTeamLeadDashboardQuery, useGetOperationsDashboardQuery } = dashboardApi;
