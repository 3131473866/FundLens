import { currency, monthLabel, percent } from '../lib/format';
import type { Projection } from '../lib/projections';

export function Summary({ projection: p }: { projection: Projection }) {
  const rows: [string, string][] = [
    ['Award total', currency(p.project.awardTotal)],
    ['Spent through ' + monthLabel(p.lastActualMonth), `${currency(p.spent)} (${percent(p.pctSpent)})`],
    ['Remaining', currency(p.remaining)],
    ['Time elapsed', `${percent(p.pctTime)} of the award period`],
    ['Ends', monthLabel(p.project.endMonth)],
    [p.projectedVariance >= 0 ? 'Projected unspent at end' : 'Projected overspend', currency(Math.abs(p.projectedVariance))],
  ];
  return (
    <section aria-labelledby="sum-title">
      <h3 id="sum-title">Award snapshot</h3>
      <dl className="facts">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
