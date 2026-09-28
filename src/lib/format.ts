import type { MonthKey } from '../types';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usdCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const currency = (n: number) => usd.format(Math.round(n));
export const compactCurrency = (n: number) => usdCompact.format(n);
export const percent = (n: number) => `${Math.round(n * 100)}%`;

function monthDate(m: MonthKey): Date {
  const [y = 1970, mo = 1] = m.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, 1));
}

/** "Mar 2026" */
export const monthLabel = (m: MonthKey) =>
  monthDate(m).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

/** "Mar 26" for tight chart axes */
export const monthShort = (m: MonthKey) =>
  monthDate(m).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
