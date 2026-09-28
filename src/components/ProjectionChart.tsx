import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { compactCurrency, currency, monthLabel, monthShort } from '../lib/format';
import type { Projection } from '../lib/projections';

const SERIES_NAMES: Record<string, string> = {
  actual: 'Spent (statements)',
  projected: 'Projected',
  plan: 'Even pace',
};

export function ProjectionChart({ projection: p }: { projection: Projection }) {
  const { project, series } = p;
  const summary = `Cumulative spending for ${project.name}. ${currency(p.spent)} spent through ${monthLabel(p.lastActualMonth)}; projected ${currency(p.projectedEndSpend)} at the end date against an award of ${currency(project.awardTotal)}.`;

  return (
    <figure className="chart">
      <ul className="legend" aria-hidden="true">
        <li><span className="legend__swatch legend__swatch--actual" />Spent (statements)</li>
        <li><span className="legend__swatch legend__swatch--projected" />Projected</li>
        <li><span className="legend__swatch legend__swatch--plan" />Even pace</li>
        <li><span className="legend__swatch legend__swatch--ceiling" />Award total</li>
      </ul>

      <div role="img" aria-label={summary} className="chart__canvas">
        <ResponsiveContainer width="100%" height={340} minWidth={0}>
          <ComposedChart data={series} margin={{ top: 12, right: 24, bottom: 4, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="month" tickFormatter={monthShort} minTickGap={36} stroke="var(--muted)" tickLine={false} />
            <YAxis
              tickFormatter={compactCurrency}
              width={76}
              stroke="var(--muted)"
              tickLine={false}
              axisLine={false}
              domain={[0, (max: number) => Math.max(max, project.awardTotal * 1.05)]}
            />
            <Tooltip
              labelFormatter={(m) => monthLabel(String(m))}
              formatter={(v, name) => [typeof v === 'number' ? currency(v) : String(v), SERIES_NAMES[String(name)] ?? String(name)]}
            />
            <ReferenceLine y={project.awardTotal} stroke="var(--danger)" strokeDasharray="2 4" />
            <ReferenceLine
              x={p.lastActualMonth}
              stroke="var(--muted)"
              label={{ value: 'Latest statement', position: 'insideTopLeft', fill: 'var(--muted)', fontSize: 12 }}
            />
            <Line dataKey="plan" name="plan" stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="1 5" dot={false} isAnimationActive={false} />
            <Area dataKey="actual" name="actual" stroke="var(--primary)" strokeWidth={2.5} fill="var(--primary-soft)" fillOpacity={0.7} isAnimationActive={false} />
            <Line dataKey="projected" name="projected" stroke="var(--projection)" strokeWidth={2.5} strokeDasharray="7 5" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <details className="chart__table">
        <summary>View chart data as a table</summary>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">Cumulative spending by month</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col" className="num">Spent</th>
                <th scope="col" className="num">Projected</th>
                <th scope="col" className="num">Even pace</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.month}>
                  <th scope="row">{monthLabel(s.month)}</th>
                  <td className="num">{s.actual === null ? '' : currency(s.actual)}</td>
                  <td className="num">{s.projected === null ? '' : currency(s.projected)}</td>
                  <td className="num">{currency(s.plan)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
