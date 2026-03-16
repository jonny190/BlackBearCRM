import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<{ data: { accessToken: string; user: any } }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    refresh: build.mutation<{ data: { accessToken: string } }, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),
    getMe: build.query<{ data: any }, void>({
      query: () => '/auth/me',
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useRefreshMutation, useGetMeQuery } = authApi;
