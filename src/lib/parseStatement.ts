import Papa from 'papaparse';
import type { Expense, Ledger, MonthKey, Project } from '../types';
import { monthsBetween, normalizeMonth } from './months';

export class StatementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StatementError';
  }
}

export interface ParseResult {
  ledger: Ledger;
  warnings: string[];
}

type Field = 'projectId' | 'projectName' | 'pi' | 'awardTotal' | 'startMonth' | 'endMonth' | 'month' | 'category' | 'amount';

/** Header aliases (lowercase, letters/digits only) so exports from different systems still import. */
const ALIASES: Record<Field, string[]> = {
  projectId: ['projectid', 'project', 'account', 'accountid', 'awardid', 'fund'],
  projectName: ['projectname', 'title', 'awardtitle', 'accountname'],
  pi: ['pi', 'principalinvestigator', 'faculty'],
  awardTotal: ['awardtotal', 'award', 'awardamount', 'totalbudget', 'budget'],
  startMonth: ['startmonth', 'startdate', 'start'],
  endMonth: ['endmonth', 'enddate', 'end'],
  month: ['month', 'period', 'statementmonth', 'date'],
  category: ['category', 'expensecategory', 'type', 'object'],
  amount: ['amount', 'expense', 'expenses', 'spend', 'actual', 'actuals'],
};

const REQUIRED: Field[] = ['projectId', 'month', 'category', 'amount', 'awardTotal', 'endMonth'];
const LABELS: Record<Field, string> = {
  projectId: 'project_id',
  projectName: 'project_name',
  pi: 'pi',
  awardTotal: 'award_total',
  startMonth: 'start_month',
  endMonth: 'end_month',
  month: 'month',
  category: 'category',
  amount: 'amount',
};
const REQUIRED_HINT = 'project_id, month, category, amount, award_total, end_month';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** "$1,200.50" -> 1200.5, "(300)" -> -300, "" -> null */
export function parseAmount(raw: string): number | null {
  const s = raw.trim();
  const digits = s.replace(/[()$,\s-]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  if (!Number.isFinite(n)) return null;
  return /^\(.*\)$/.test(s) || s.startsWith('-') ? -n : n;
}

function resolveColumns(headers: string[]): Partial<Record<Field, string>> {
  const byNorm = new Map(headers.map((h) => [norm(h), h]));
  const cols: Partial<Record<Field, string>> = {};
  for (const field of Object.keys(ALIASES) as Field[]) {
    for (const alias of ALIASES[field]) {
      const header = byNorm.get(alias);
      if (header) {
        cols[field] = header;
        break;
      }
    }
  }
  return cols;
}

interface ProjectDraft {
  name?: string;
  pi?: string;
  awardTotal?: number;
  startMonth?: MonthKey;
  endMonth?: MonthKey;
}

/**
 * Turns a monthly statement export (CSV text) into a Ledger.
 * One row per project + month + category. Bad rows are skipped and reported, not fatal.
 */
export function parseStatement(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: 'greedy' });
  const headers = parsed.meta.fields ?? [];
  const cols = resolveColumns(headers);

  const missing = REQUIRED.filter((f) => !cols[f]);
  if (missing.length) {
    throw new StatementError(
      `Missing required column(s): ${missing.map((f) => LABELS[f]).join(', ')}. Expected headers like ${REQUIRED_HINT}.`,
    );
  }

  const warnings: string[] = [];
  const drafts = new Map<string, ProjectDraft>();
  const rows: Expense[] = [];

  parsed.data.forEach((row, i) => {
    const line = i + 2; // +1 for header, +1 for 1-based line numbers
    const get = (f: Field) => (cols[f] ? (row[cols[f]!] ?? '').trim() : '');

    const projectId = get('projectId');
    if (!projectId) return void warnings.push(`Line ${line}: missing project_id, row skipped.`);
    const month = normalizeMonth(get('month'));
    if (!month) return void warnings.push(`Line ${line}: unrecognized month "${get('month')}", row skipped.`);
    const amount = parseAmount(get('amount'));
    if (amount === null) return void warnings.push(`Line ${line}: invalid amount "${get('amount')}", row skipped.`);

    rows.push({ projectId, month, category: get('category') || 'Uncategorized', amount });

    const draft = drafts.get(projectId) ?? {};
    draft.name ||= get('projectName') || undefined;
    draft.pi ||= get('pi') || undefined;
    if (draft.awardTotal === undefined) {
      const award = parseAmount(get('awardTotal'));
      if (award !== null && award > 0) draft.awardTotal = award;
    }
    draft.endMonth ||= normalizeMonth(get('endMonth')) ?? undefined;
    draft.startMonth ||= normalizeMonth(get('startMonth')) ?? undefined;
    drafts.set(projectId, draft);
  });

  const projects: Project[] = [];
  for (const [id, d] of drafts) {
    if (d.awardTotal === undefined || !d.endMonth) {
      warnings.push(`Project ${id} skipped: it needs a positive award_total and a valid end_month.`);
      continue;
    }
    const months = rows.filter((r) => r.projectId === id).map((r) => r.month).sort();
    const earliest = months[0]!;
    const startMonth = d.startMonth && monthsBetween(d.startMonth, earliest) >= 0 ? d.startMonth : earliest;
    if (monthsBetween(startMonth, d.endMonth) < 0) {
      warnings.push(`Project ${id} skipped: end_month is before its first statement month.`);
      continue;
    }
    projects.push({ id, name: d.name ?? id, pi: d.pi, awardTotal: d.awardTotal, startMonth, endMonth: d.endMonth });
  }

  if (!projects.length) throw new StatementError('No usable projects found in this file.');

  const valid = new Set(projects.map((p) => p.id));
  return { ledger: { projects, expenses: rows.filter((r) => valid.has(r.projectId)) }, warnings };
}
