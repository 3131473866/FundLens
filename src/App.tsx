import { lazy, Suspense, useMemo, useState } from 'react';
import { usingMockApi } from './api/client';
import { CategoryTable } from './components/CategoryTable';
import { ProjectList } from './components/ProjectList';
import { ScenarioControls } from './components/ScenarioControls';
import { StatusBadge } from './components/StatusBadge';
import { Summary } from './components/Summary';
import { UploadPanel } from './components/UploadPanel';
import { useLedger } from './hooks/useLedger';
import { downloadText, projectionToCsv } from './lib/exportCsv';
import { headline } from './lib/narrative';
import { buildAll, byRisk, DEFAULT_OPTIONS, type ProjectionOptions } from './lib/projections';

// The chart library is the heaviest dependency, so it loads in its own chunk after the first paint.
const ProjectionChart = lazy(() =>
  import('./components/ProjectionChart').then((m) => ({ default: m.ProjectionChart })),
);

export default function App() {
  const { state, reload, importFile } = useLedger();
  const [selectedId, setSelectedId] = useState<string>();
  const [opts, setOpts] = useState<ProjectionOptions>(DEFAULT_OPTIONS);

  const ordered = useMemo(
    () => (state.ledger ? buildAll(state.ledger.projects, state.ledger.expenses, opts).sort(byRisk) : []),
    [state.ledger, opts],
  );
  const active = ordered.find((p) => p.project.id === selectedId) ?? ordered[0];

  const sourceLabel =
    state.source === 'file' ? `Statement: ${state.fileName}` : usingMockApi ? 'Demo API (synthetic data)' : 'Live API';

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1 className="brand">FundLens</h1>
          <p className="brand__sub">See where each research award is headed.</p>
        </div>
        <div className="source">
          <p className="source__label">
            <span className="sr-only">Data source: </span>
            {sourceLabel}
          </p>
          <button type="button" className="btn" onClick={() => void reload()} disabled={state.status === 'loading'}>
            {state.source === 'file' ? 'Switch to API data' : 'Refresh data'}
          </button>
        </div>
      </header>

      <aside className="rail">
        {ordered.length > 0 && <ProjectList projections={ordered} activeId={active?.project.id} onSelect={setSelectedId} />}
        <UploadPanel onFile={(f) => void importFile(f)} error={state.uploadError} warnings={state.warnings} />
      </aside>

      <main className="main" id="main">
        {state.status === 'loading' && !state.ledger && <p className="empty" role="status">Loading awards…</p>}

        {state.status === 'error' && (
          <div className="empty" role="alert">
            <p>{state.error}</p>
            <button type="button" className="btn" onClick={() => void reload()}>Try again</button>
          </div>
        )}

        {active && (
          <>
            <section aria-labelledby="award-title" className="hero">
              <div className="hero__head">
                <div>
                  <h2 id="award-title">{active.project.name}</h2>
                  <p className="hero__meta">
                    {active.project.id}
                    {active.project.pi ? `, ${active.project.pi}` : ''}
                  </p>
                </div>
                <StatusBadge status={active.status} />
              </div>
              <p className="hero__lede" aria-live="polite">{headline(active)}</p>
            </section>

            <Suspense fallback={<p className="empty" role="status">Drawing chart…</p>}>
              <ProjectionChart projection={active} />
            </Suspense>

            <div className="actions">
              <button
                type="button"
                className="btn"
                onClick={() => downloadText(`${active.project.id}-projection.csv`, projectionToCsv(active))}
              >
                Download projection (.csv)
              </button>
              <button type="button" className="btn btn--quiet" onClick={() => window.print()}>
                Print this page
              </button>
            </div>

            <div className="split">
              <ScenarioControls opts={opts} onChange={setOpts} projection={active} />
              <Summary projection={active} />
            </div>

            <CategoryTable projection={active} />
          </>
        )}
      </main>
    </div>
  );
}
