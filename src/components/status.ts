import type { Status } from '../lib/projections';

export const STATUS_META: Record<Status, { label: string; className: string }> = {
  over: { label: 'Projected overspend', className: 'status--over' },
  watch: { label: 'Little cushion', className: 'status--watch' },
  'on-track': { label: 'On track', className: 'status--ok' },
  underspent: { label: 'Underspending', className: 'status--under' },
};
