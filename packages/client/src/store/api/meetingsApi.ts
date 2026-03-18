import { baseApi } from './baseApi';
import type { MeetingNote, ProcessedCustomerNote, ApiResponse, PaginationMeta } from '@blackbear/shared';

export const meetingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMeetingNotes: build.query<{ data: MeetingNote[]; meta: PaginationMeta }, { accountId: string; params?: Record<string, any> }>({
      query: ({ accountId, params }) => ({ url: `/accounts/${accountId}/meeting-notes`, params }),
      providesTags: (result) =>
        result
          ? [...result.data.map((n) => ({ type: 'MeetingNote' as const, id: n.id })), 'MeetingNote']
          : ['MeetingNote'],
    }),
    createMeetingNote: build.mutation<ApiResponse<MeetingNote>, { accountId: string; data: Partial<MeetingNote> }>({
      query: ({ accountId, data }) => ({ url: `/accounts/${accountId}/meeting-notes`, method: 'POST', body: data }),
      invalidatesTags: ['MeetingNote'],
    }),
    updateMeetingNote: build.mutation<ApiResponse<MeetingNote>, { id: string; data: Partial<MeetingNote> }>({
      query: ({ id, data }) => ({ url: `/meeting-notes/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'MeetingNote', id }, 'MeetingNote'],
    }),
    deleteMeetingNote: build.mutation<void, string>({
      query: (id) => ({ url: `/meeting-notes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MeetingNote'],
    }),
    processMeetingNote: build.mutation<ApiResponse<{ message: string }>, string>({
      query: (id) => ({ url: `/meeting-notes/${id}/process`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'MeetingNote', id }],
    }),
    getMeetingNoteInsights: build.query<{ data: ProcessedCustomerNote[] }, string>({
      query: (id) => ({ url: `/meeting-notes/${id}/insights` }),
      providesTags: (_r, _e, id) => [{ type: 'Insight', id }],
    }),
  }),
});

export const {
  useGetMeetingNotesQuery,
  useCreateMeetingNoteMutation,
  useUpdateMeetingNoteMutation,
  useDeleteMeetingNoteMutation,
  useProcessMeetingNoteMutation,
  useGetMeetingNoteInsightsQuery,
} = meetingsApi;
