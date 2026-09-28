import { percent } from '../lib/format';
import type { Projection } from '../lib/projections';
import { StatusBadge } from './StatusBadge';

interface Props {
  projections: Projection[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
}

export function ProjectList({ projections, activeId, onSelect }: Props) {
  return (
    <nav aria-label="Awards">
      <h2 className="rail__title">Awards ({projections.length})</h2>
      <p className="rail__hint">Sorted by who needs attention first.</p>
      <ul className="project-list">
        {projections.map((p) => {
          const active = p.project.id === activeId;
          return (
            <li key={p.project.id}>
              <button
                type="button"
                className="project-item"
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelect(p.project.id)}
              >
                <span className="project-item__name">{p.project.name}</span>
                <span className="project-item__meta">
                  {p.project.id}
                  {p.project.pi ? `, ${p.project.pi}` : ''}
                </span>
                <span
                  className="meter"
                  role="img"
                  aria-label={`${percent(p.pctSpent)} of the award spent, ${percent(p.pctTime)} of the time elapsed`}
                >
                  <span className="meter__spent" style={{ width: `${Math.min(100, p.pctSpent * 100)}%` }} />
                  <span className="meter__time" style={{ left: `${p.pctTime * 100}%` }} />
                </span>
                <StatusBadge status={p.status} />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
