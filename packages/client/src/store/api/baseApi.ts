import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// We define a minimal interface here to avoid a circular dependency with store.ts.
// store.ts imports baseApi, and baseApi would import RootState from store.ts.
// Instead we type the relevant slice of state directly.
interface StoreStateWithAuth {
  auth: { accessToken: string | null };
}

export const baseApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as StoreStateWithAuth).auth.accessToken;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Account', 'Contact', 'Activity', 'Health', 'Alert', 'Dashboard', 'User', 'AiSettings', 'Relationship', 'Integration'],
  endpoints: () => ({}),
});
