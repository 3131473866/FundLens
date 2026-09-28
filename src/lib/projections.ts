import type { Expense, MonthKey, Project } from '../types';
import { addMonths, listMonths, maxMonth, monthsBetween } from './months';

export type BurnMethod = 'trailing3' | 'trailing6' | 'lifetime';
export type Status = 'over' | 'watch' | 'on-track' | 'underspent';

export interface ProjectionOptions {
  /** How the "typical month" is estimated from past statements. */
  method: BurnMethod;
  /** What-if adjustment applied to future monthly spend, e.g. -10 = spend 10% less. */
  adjustPct: number;
}

export const DEFAULT_OPTIONS: ProjectionOptions = { method: 'trailing3', adjustPct: 0 };

export interface SeriesPoint {
  month: MonthKey;
  /** Cumulative spend from statements (null after the latest statement). */
  actual: number | null;
  /** Cumulative spend forecast (null before the latest statement / after the end date). */
  projected: number | null;
  /** Straight-line "even pace" reference so faculty can see if they are ahead or behind. */
  plan: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
  share: number;
}

export interface Projection {
  project: Project;
  series: SeriesPoint[];
  lastActualMonth: MonthKey;
  spent: number;
  remaining: number;
  pctSpent: number;
  pctTime: number;
  /** Typical monthly spend before the what-if adjustment. */
  baseBurn: number;
  /** Monthly spend used for the forecast (after the what-if adjustment). */
  burn: number;
  monthsRemaining: number;
  projectedEndSpend: number;
  /** Positive = money left over at the end date, negative = overspend. */
  projectedVariance: number;
  runoutMonth: MonthKey | null;
  monthsShort: number;
  /** Monthly spend that lands exactly on the award total at the end date. */
  recommendedBurn: number;
  status: Status;
  categories: CategoryTotal[];
}

export function groupByProject(expenses: Expense[]): Map<string, Expense[]> {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const list = map.get(e.projectId);
    if (list) list.push(e);
    else map.set(e.projectId, [e]);
  }
  return map;
}

export function statusFor(projectedEndSpend: number, awardTotal: number): Status {
  if (projectedEndSpend > awardTotal + 0.5) return 'over';
  const ratio = projectedEndSpend / awardTotal;
  if (ratio >= 0.97) return 'watch';
  if (ratio >= 0.85) return 'on-track';
  return 'underspent';
}

/**
 * Pure function: given one award and its expense rows, estimate where spending will land.
 * `expenses` must already be filtered to this project (see groupByProject).
 */
export function buildProjection(
  project: Project,
  expenses: Expense[],
  opts: ProjectionOptions = DEFAULT_OPTIONS,
): Projection {
  const byMonth = new Map<MonthKey, number>();
  const byCategory = new Map<string, number>();
  let spent = 0;
  for (const e of expenses) {
    byMonth.set(e.month, (byMonth.get(e.month) ?? 0) + e.amount);
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
    spent += e.amount;
  }

  const lastActualMonth = byMonth.size ? maxMonth([...byMonth.keys()]) : project.startMonth;
  const monthsElapsed = Math.max(1, monthsBetween(project.startMonth, lastActualMonth) + 1);

  // Average of the most recent N statement months. Months with no charges count as $0.
  const windowSize = opts.method === 'trailing3' ? 3 : opts.method === 'trailing6' ? 6 : monthsElapsed;
  const n = Math.min(windowSize, monthsElapsed);
  let windowSum = 0;
  for (let i = 0; i < n; i++) windowSum += byMonth.get(addMonths(lastActualMonth, -i)) ?? 0;

  const baseBurn = Math.max(0, windowSum / n);
  const burn = baseBurn * (1 + opts.adjustPct / 100);
  const monthsRemaining = Math.max(0, monthsBetween(lastActualMonth, project.endMonth));
  const projectedEndSpend = spent + burn * monthsRemaining;

  const chartEnd = maxMonth([project.endMonth, lastActualMonth]);
  const planMonths = monthsBetween(project.startMonth, project.endMonth) + 1;
  let cumulative = 0;
  const series: SeriesPoint[] = listMonths(project.startMonth, chartEnd).map((month, i) => {
    const isActual = monthsBetween(month, lastActualMonth) >= 0;
    if (isActual) cumulative += byMonth.get(month) ?? 0;
    const k = monthsBetween(lastActualMonth, month);
    const beforeEnd = monthsBetween(month, project.endMonth) >= 0;
    return {
      month,
      actual: isActual ? cumulative : null,
      projected: k >= 0 && beforeEnd ? spent + burn * k : null,
      plan: project.awardTotal * Math.min(1, (i + 1) / planMonths),
    };
  });

  let runoutMonth: MonthKey | null = null;
  if (spent > project.awardTotal) {
    runoutMonth = lastActualMonth;
  } else if (burn > 0) {
    for (let k = 1; k <= monthsRemaining; k++) {
      if (spent + burn * k > project.awardTotal) {
        runoutMonth = addMonths(lastActualMonth, k);
        break;
      }
    }
  }

  const remaining = project.awardTotal - spent;
  const categories: CategoryTotal[] = [...byCategory.entries()]
    .map(([category, total]) => ({ category, total, share: spent > 0 ? total / spent : 0 }))
    .sort((a, b) => b.total - a.total);

  return {
    project,
    series,
    lastActualMonth,
    spent,
    remaining,
    pctSpent: spent / project.awardTotal,
    pctTime: Math.min(1, monthsElapsed / planMonths),
    baseBurn,
    burn,
    monthsRemaining,
    projectedEndSpend,
    projectedVariance: project.awardTotal - projectedEndSpend,
    runoutMonth,
    monthsShort: runoutMonth ? Math.max(0, monthsBetween(runoutMonth, project.endMonth)) : 0,
    recommendedBurn: monthsRemaining > 0 ? Math.max(0, remaining) / monthsRemaining : 0,
    status: statusFor(projectedEndSpend, project.awardTotal),
    categories,
  };
}

export function buildAll(projects: Project[], expenses: Expense[], opts: ProjectionOptions): Projection[] {
  const grouped = groupByProject(expenses);
  return projects.map((p) => buildProjection(p, grouped.get(p.id) ?? [], opts));
}

const RANK: Record<Status, number> = { over: 0, watch: 1, 'on-track': 2, underspent: 3 };

/** Awards that need attention first. */
export function byRisk(a: Projection, b: Projection): number {
  return RANK[a.status] - RANK[b.status] || a.project.name.localeCompare(b.project.name);
}
