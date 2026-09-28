# FundLens

**Interactive spending projections for research awards.** Upload a monthly statement (or connect an API) and faculty can see, in plain language, whether an award is on track, when funds would run out, and what a change in spending would do.

<!-- Add a screenshot: docs/screenshot.png -->
<!-- Live demo: https://YOUR-USERNAME.github.io/fundlens/ -->

## Why I built it

In my current role I build spending projections for faculty and turn monthly statements into charts. Each month that means manual spreadsheet work, and faculty still have to ask me questions like *"if we hold travel flat, do we finish on budget?"* FundLens turns that workflow into a self-serve web app so faculty can answer those questions themselves.

> The demo uses **synthetic data only**. No real statements, names, or institutional data are included. Uploaded files are parsed in the browser and never sent anywhere.

## Features

- **Two data sources**: upload a monthly statement (`.csv`) or load from a REST API through an Axios connector. A built-in mock API keeps the demo runnable with no backend.
- **Plain-language forecast**: each award opens with one sentence, such as *"At this pace, funds run out in Mar 2027, 3 months before the award ends."*
- **Projection chart**: cumulative spend, forecast, even-pace reference and award ceiling, with a data-table alternative for screen readers.
- **What-if scenario**: change future monthly spending by -50% to +50% and choose how a "typical month" is estimated (last 3 months, last 6 months, whole award). The tool also shows the monthly amount that finishes exactly on budget.
- **Triage list**: awards are sorted so the ones that need attention appear first.
- **Forgiving imports**: alternate header names (`Account`, `Period`), several date formats (`3/2026`, `Mar 2026`), `$` and `(parentheses)` amounts. Bad rows are skipped and reported with line numbers rather than failing the whole file.
- **Export and print**: download the projection as CSV or print a clean page.

## Tech

| Area | Choice |
| --- | --- |
| UI | React 19, TypeScript (strict), Vite |
| Data fetching | Axios instance with typed calls, request cancellation, retry with backoff for network/5xx errors |
| Charts | Recharts, code-split with `React.lazy` so first paint stays light |
| CSV | PapaParse |
| Tests | Vitest, Testing Library (unit and component tests) |
| CI/CD | GitHub Actions: typecheck, test, build, deploy to Pages |
| Styling | Hand-written CSS with design tokens, responsive layout, print styles |

## Architecture

```
src/
  api/          Axios client (retry, error mapping), mock adapter, typed endpoints
  components/   Small presentational components (chart, list, controls, tables)
  hooks/        useLedger: loading, cancellation, upload state
  lib/          Pure logic: projections, CSV parsing, month math, formatting, narrative
  data/         Seeded synthetic demo data
```

Design decisions worth knowing:

- **Projection logic is pure and separate from React.** `buildProjection(project, expenses, options)` has no side effects, which is why it is easy to test (`projections.test.ts`).
- **The API layer is swappable.** Without `VITE_API_URL`, Axios uses a custom adapter that behaves like a REST backend. Set the variable and the same code talks to a real server. See `.env.example`.
- **Requests are abortable.** Refreshing or unmounting cancels in-flight calls, so a slow response can never overwrite newer data.
- **Accessibility is built in**: labelled controls, visible focus, status shown by text and shape (not color alone), `aria-live` summaries, a table alternative to the chart, and semantic landmarks.

## How the projection works

1. Sum statement rows by month and category.
2. Estimate a typical month: the average of the most recent 3 or 6 statement months (months with no charges count as $0), or the whole-award average.
3. Apply the what-if adjustment: `forecast = typical month x (1 + adjustment)`.
4. `projected end spend = spent to date + forecast x months remaining`.
5. Compare with the award total:

| Projected end spend | Status |
| --- | --- |
| Above the award total | Projected overspend |
| 97% to 100% | Little cushion |
| 85% to 97% | On track |
| Below 85% | Underspending |

**Known limitations** (good starting points for contributions): lumpy costs such as equipment or quarterly subawards can skew short averages, so the 6-month and whole-award options exist; the model does not know about planned purchases or salary changes; encumbrances and indirect-cost rules vary by institution and are not modeled.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test
npm run build
```

Try the upload flow with `public/sample-statement.csv`.

### Statement format

One row per award, month and category.

| Column | Required | Example |
| --- | --- | --- |
| `project_id` | yes | `NSF-2311` |
| `month` | yes | `2026-03` |
| `category` | yes | `Travel` |
| `amount` | yes | `1250.50` |
| `award_total` | yes | `900000` |
| `end_month` | yes | `2027-06` |
| `project_name`, `pi`, `start_month` | no | |

### Connecting a real API

Set `VITE_API_URL` and serve:

- `GET /projects` returns `Project[]`
- `GET /expenses?projectId=...` returns `Expense[]`

Types are in `src/types.ts`.

## Roadmap

- Planned-purchase entries (for example "$20k equipment in November") layered on the forecast
- Compare forecast against the original budget by category
- Saved scenarios and shareable links
- Schema validation of API responses (for example with Zod)
- End-to-end tests with Playwright

---

