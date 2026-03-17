import { baseApi } from './baseApi';

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getHealthDistribution: build.query<{ data: any }, void>({
      query: () => '/reports/health-distribution',
    }),
    getActivityTrends: build.query<{ data: any[] }, number | void>({
      query: (days) => `/reports/activity-trends?days=${days || 30}`,
    }),
    getTierBreakdown: build.query<{ data: any[] }, void>({
      query: () => '/reports/tier-breakdown',
    }),
    getTopAccounts: build.query<{ data: any[] }, void>({
      query: () => '/reports/top-accounts',
    }),
    getEngagementByTier: build.query<{ data: any[] }, void>({
      query: () => '/reports/engagement-by-tier',
    }),
  }),
});

export const {
  useGetHealthDistributionQuery,
  useGetActivityTrendsQuery,
  useGetTierBreakdownQuery,
  useGetTopAccountsQuery,
  useGetEngagementByTierQuery,
} = reportsApi;
