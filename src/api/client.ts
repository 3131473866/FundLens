import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { mockAdapter } from './mockAdapter';

/** True when no real backend is configured and the built-in mock API is used. */
export const usingMockApi = !import.meta.env.VITE_API_URL;

const MAX_RETRIES = 2;
type RetryConfig = InternalAxiosRequestConfig & { __retryCount?: number };

const isRetryable = (error: AxiosError) =>
  !error.response || (error.response.status >= 500 && error.response.status < 600);

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '/api',
    timeout: 10_000,
    adapter: usingMockApi ? mockAdapter : undefined,
  });

  // Retry network errors and 5xx responses with exponential backoff. Never retry cancellations or 4xx.
  client.interceptors.response.use(undefined, async (error: unknown) => {
    if (!axios.isAxiosError(error) || axios.isCancel(error) || !error.config) throw error;
    const config = error.config as RetryConfig;
    const attempt = config.__retryCount ?? 0;
    if (!isRetryable(error) || attempt >= MAX_RETRIES) throw error;
    config.__retryCount = attempt + 1;
    await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
    return client.request(config);
  });

  return client;
}

export const api = createApiClient();

/** Turns any thrown value into a message a faculty member can act on. */
export function describeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response) return `The server responded with an error (${error.response.status}).`;
    return 'Could not reach the data service. Check your connection or upload a statement instead.';
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}
