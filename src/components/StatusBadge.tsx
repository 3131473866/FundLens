import type { Status } from '../lib/projections';
import { STATUS_META } from './status';

export function StatusBadge({ status }: { status: Status }) {
  const meta = STATUS_META[status];
  return (
    <span className={`status ${meta.className}`}>
      <span className="status__dot" aria-hidden="true" />
      {meta.label}
    </span>
  );
}
