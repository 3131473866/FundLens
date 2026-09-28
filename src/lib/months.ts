import type { MonthKey } from '../types';

const NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const pad = (n: number) => String(n).padStart(2, '0');

export function monthIndex(m: MonthKey): number {
  const [y = 0, mo = 1] = m.split('-').map(Number);
  return y * 12 + (mo - 1);
}

export function fromIndex(i: number): MonthKey {
  return `${Math.floor(i / 12)}-${pad((i % 12) + 1)}`;
}

export const addMonths = (m: MonthKey, n: number): MonthKey => fromIndex(monthIndex(m) + n);

/** Whole months from a to b (negative if b is earlier). */
export const monthsBetween = (a: MonthKey, b: MonthKey): number => monthIndex(b) - monthIndex(a);

export function listMonths(a: MonthKey, b: MonthKey): MonthKey[] {
  const out: MonthKey[] = [];
  for (let i = monthIndex(a); i <= monthIndex(b); i++) out.push(fromIndex(i));
  return out;
}

export function maxMonth(months: MonthKey[]): MonthKey {
  return months.reduce((a, b) => (monthIndex(b) > monthIndex(a) ? b : a));
}

/**
 * Accepts the date formats commonly found in finance exports and returns "YYYY-MM":
 * 2026-03, 2026-03-15, 3/2026, 03/15/2026, "Mar 2026", "March 2026".
 */
export function normalizeMonth(raw: string): MonthKey | null {
  const s = raw.trim();
  let year: number;
  let month: number;

  let m = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/.exec(s);
  if (m) {
    year = Number(m[1]);
    month = Number(m[2]);
  } else if ((m = /^(\d{1,2})\/(?:\d{1,2}\/)?(\d{4})$/.exec(s))) {
    year = Number(m[2]);
    month = Number(m[1]);
  } else if ((m = /^([A-Za-z]{3,9})\.?,?\s+(\d{4})$/.exec(s))) {
    month = NAMES.indexOf((m[1] ?? '').slice(0, 3).toLowerCase()) + 1;
    year = Number(m[2]);
  } else {
    return null;
  }

  if (month < 1 || month > 12) return null;
  return `${year}-${pad(month)}`;
}
