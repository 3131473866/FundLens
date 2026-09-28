import { currency } from '../lib/format';
import type { BurnMethod, Projection, ProjectionOptions } from '../lib/projections';

interface Props {
  opts: ProjectionOptions;
  onChange: (next: ProjectionOptions) => void;
  projection: Projection;
}

const METHODS: { value: BurnMethod; label: string }[] = [
  { value: 'trailing3', label: 'Last 3 months' },
  { value: 'trailing6', label: 'Last 6 months' },
  { value: 'lifetime', label: 'Whole award so far' },
];

export function ScenarioControls({ opts, onChange, projection: p }: Props) {
  const sign = opts.adjustPct > 0 ? '+' : '';
  return (
    <section aria-labelledby="scenario-title" className="scenario">
      <h3 id="scenario-title">What if spending changes?</h3>

      <div className="field">
        <label htmlFor="method">Estimate a typical month from</label>
        <select id="method" value={opts.method} onChange={(e) => onChange({ ...opts, method: e.target.value as BurnMethod })}>
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <div className="field__row">
          <label htmlFor="adjust">Change future monthly spending</label>
          <output htmlFor="adjust">{sign}{opts.adjustPct}%</output>
        </div>
        <input
          id="adjust"
          type="range"
          min={-50}
          max={50}
          step={5}
          value={opts.adjustPct}
          onChange={(e) => onChange({ ...opts, adjustPct: Number(e.target.value) })}
        />
      </div>

      <dl className="scenario__result" aria-live="polite">
        <div>
          <dt>Forecast monthly spending</dt>
          <dd>{currency(p.burn)}</dd>
        </div>
        <div>
          <dt>To finish exactly on budget</dt>
          <dd>{p.monthsRemaining > 0 ? `${currency(p.recommendedBurn)} a month` : 'Award has ended'}</dd>
        </div>
      </dl>

      {(opts.adjustPct !== 0 || opts.method !== 'trailing3') && (
        <button type="button" className="btn btn--quiet" onClick={() => onChange({ method: 'trailing3', adjustPct: 0 })}>
          Reset scenario
        </button>
      )}
    </section>
  );
}
