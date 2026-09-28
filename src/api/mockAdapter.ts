import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { DEMO_EXPENSES, DEMO_PROJECTS } from '../data/demo';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse {
  return { data, status, statusText: status === 200 ? 'OK' : 'Not Found', headers: {}, config };
}

/**
 * An Axios adapter that answers like a small REST backend, so the app runs with no server.
 * Swap it out by setting VITE_API_URL; the rest of the app cannot tell the difference.
 *   GET /projects
 *   GET /expenses?projectId=...
 */
export const mockAdapter: AxiosAdapter = async (config) => {
  await sleep(350); // feel like a real network call
  if (config.signal?.aborted) {
    throw new AxiosError('canceled', AxiosError.ERR_CANCELED, config);
  }

  const path = (config.url ?? '').replace(/^\/+/, '');
  if (path === 'projects') return respond(config, 200, DEMO_PROJECTS);
  if (path === 'expenses') {
    const projectId = config.params?.projectId as string | undefined;
    return respond(config, 200, projectId ? DEMO_EXPENSES.filter((e) => e.projectId === projectId) : DEMO_EXPENSES);
  }
  const res = respond(config, 404, { message: `No mock route for /${path}` });
  throw new AxiosError(`Request failed with status code 404`, AxiosError.ERR_BAD_REQUEST, config, undefined, res);
};
