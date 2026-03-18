import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

interface StoreStateWithAuth {
  auth: { accessToken: string | null };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as StoreStateWithAuth).auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Try refreshing the token
    const refreshResult = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const data = refreshResult.data as { data: { accessToken: string } };
      // Store the new token
      api.dispatch({
        type: 'auth/setToken',
        payload: data.data.accessToken,
      });
      // Retry the original request
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      // Refresh failed -- clear credentials and redirect to login
      api.dispatch({ type: 'auth/clearCredentials' });
      window.location.href = '/login';
    }
  }

  return result;
};

export const baseApi = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Account', 'Contact', 'Activity', 'Health', 'Alert', 'Dashboard', 'User', 'AiSettings', 'Relationship', 'Integration', 'MeetingNote', 'Insight'],
  endpoints: () => ({}),
});
