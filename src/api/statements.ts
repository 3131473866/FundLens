import type { Expense, Ledger, Project } from '../types';
import { api } from './client';

/** Loads every project and its expense rows. Requests run in parallel and can be aborted. */
export async function fetchLedger(signal?: AbortSignal): Promise<Ledger> {
  const { data: projects } = await api.get<Project[]>('/projects', { signal });
  const responses = await Promise.all(
    projects.map((p) => api.get<Expense[]>('/expenses', { params: { projectId: p.id }, signal })),
  );
  return { projects, expenses: responses.flatMap((r) => r.data) };
}
