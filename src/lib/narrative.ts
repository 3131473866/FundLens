import { currency, monthLabel, plural } from './format';
import type { Projection } from './projections';

/** One plain-language sentence describing where the award is headed. */
export function headline(p: Projection): string {
  const end = monthLabel(p.project.endMonth);
  const left = currency(Math.abs(p.projectedVariance));

  if (p.monthsRemaining === 0 && p.status !== 'over') {
    return `The award has ended with ${currency(p.remaining)} unspent.`;
  }
  switch (p.status) {
    case 'over':
      if (p.runoutMonth && p.monthsShort > 0) {
        return `At this pace, funds run out in ${monthLabel(p.runoutMonth)}, ${plural(p.monthsShort, 'month')} before the award ends.`;
      }
      return `At this pace, spending will exceed the award by ${left} before it ends in ${end}.`;
    case 'watch':
      return `Spending is close to the ceiling. About ${left} would be left when the award ends in ${end}.`;
    case 'on-track':
      return `On track to finish with about ${left} unspent when the award ends in ${end}.`;
    case 'underspent':
      return `At this pace, about ${left} will go unspent when the award ends in ${end}.`;
  }
}
