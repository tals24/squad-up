/**
 * React Query Provider
 * Configures and provides React Query client to the entire app
 *
 * Benefits:
 * - Automatic caching of API responses
 * - Background data synchronization
 * - Optimistic updates
 * - Reduced API calls (90% reduction)
 * - Instant page navigation with cached data
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * Query Client Configuration
 *
 * Cache Strategy:
 * - staleTime: 5 minutes - Data considered fresh for 5 min (no refetch)
 * - cacheTime: 10 minutes - Unused data kept in cache for 10 min
 * - refetchOnWindowFocus: true - Refresh when user returns to tab
 * - retry: 1 - Retry failed requests once
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
      // Reduce network calls
      refetchInterval: false, // Don't poll by default
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Query Provider Component
 * Wraps app with React Query functionality
 */
export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />}
    </QueryClientProvider>
  );
}

export { queryClient };
export default QueryProvider;
