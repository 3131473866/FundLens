import type { Projection } from './projections';

const cell = (v: string | number | null) => (v === null ? '' : typeof v === 'number' ? v.toFixed(2) : `"${v.replace(/"/g, '""')}"`);

/** Month-by-month projection as CSV, ready to paste into a faculty budget report. */
export function projectionToCsv(p: Projection): string {
  const header = ['project_id', 'month', 'cumulative_actual', 'cumulative_projected', 'even_pace_plan'];
  const rows = p.series.map((s) =>
    [p.project.id, s.month, s.actual, s.projected, s.plan].map((v) => cell(v as string | number | null)).join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

export function downloadText(filename: string, text: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
