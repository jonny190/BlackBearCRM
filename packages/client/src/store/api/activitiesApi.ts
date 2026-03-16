import { baseApi } from './baseApi';
import type { Activity, ApiResponse, PaginationMeta } from '@blackbear/shared';

export const activitiesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getActivities: build.query<{ data: Activity[]; meta: PaginationMeta }, Record<string, any>>({
      query: (params) => ({ url: '/activities', params }),
      providesTags: ['Activity'],
    }),
    createActivity: build.mutation<ApiResponse<Activity>, Partial<Activity>>({
      query: (body) => ({ url: '/activities', method: 'POST', body }),
      invalidatesTags: ['Activity', 'Health', 'Dashboard'],
    }),
    updateActivity: build.mutation<ApiResponse<Activity>, { id: string; data: Partial<Activity> }>({
      query: ({ id, data }) => ({ url: `/activities/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Activity'],
    }),
    deleteActivity: build.mutation<void, string>({
      query: (id) => ({ url: `/activities/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Activity', 'Health', 'Dashboard'],
    }),
  }),
});

export const {
  useGetActivitiesQuery, useCreateActivityMutation,
  useUpdateActivityMutation, useDeleteActivityMutation,
} = activitiesApi;
