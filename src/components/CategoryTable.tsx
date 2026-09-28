import { currency, percent } from '../lib/format';
import type { Projection } from '../lib/projections';

export function CategoryTable({ projection: p }: { projection: Projection }) {
  return (
    <section aria-labelledby="cat-title">
      <h3 id="cat-title">Where the money went</h3>
      <div className="table-scroll">
        <table className="cat-table">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col" className="num">Spent</th>
              <th scope="col" className="cat-table__share">Share of spending</th>
            </tr>
          </thead>
          <tbody>
            {p.categories.map((c) => (
              <tr key={c.category}>
                <th scope="row">{c.category}</th>
                <td className="num">{currency(c.total)}</td>
                <td className="cat-table__share">
                  <span className="bar"><span className="bar__fill" style={{ width: `${Math.max(0, c.share) * 100}%` }} /></span>
                  <span className="bar__label">{percent(c.share)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
