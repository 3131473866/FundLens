import { describe, expect, it } from 'vitest';
import type { Expense, Project } from '../types';
import { buildProjection, statusFor } from './projections';
import { headline } from './narrative';

const project: Project = {
  id: 'P1',
  name: 'Test award',
  awardTotal: 120_000,
  startMonth: '2026-01',
  endMonth: '2026-12',
};

/** $10,000 a month, January through June. */
const sixMonths: Expense[] = ['01', '02', '03', '04', '05', '06'].map((m) => ({
  projectId: 'P1',
  month: `2026-${m}`,
  category: 'Salaries',
  amount: 10_000,
}));

describe('buildProjection', () => {
  it('summarizes spending to date', () => {
    const p = buildProjection(project, sixMonths);
    expect(p.spent).toBe(60_000);
    expect(p.remaining).toBe(60_000);
    expect(p.lastActualMonth).toBe('2026-06');
    expect(p.monthsRemaining).toBe(6);
    expect(p.pctSpent).toBeCloseTo(0.5);
    expect(p.pctTime).toBeCloseTo(0.5);
  });

  it('projects the current pace forward and lands exactly on budget', () => {
    const p = buildProjection(project, sixMonths);
    expect(p.burn).toBe(10_000);
    expect(p.projectedEndSpend).toBe(120_000);
    expect(p.recommendedBurn).toBe(10_000);
    expect(p.status).toBe('watch');
    expect(p.runoutMonth).toBeNull();
  });

  it('flags overspend and finds the month funds run out', () => {
    const p = buildProjection(project, sixMonths, { method: 'trailing3', adjustPct: 20 });
    expect(p.projectedEndSpend).toBe(132_000);
    expect(p.status).toBe('over');
    expect(p.runoutMonth).toBe('2026-12');
    expect(headline(p)).toContain('exceed the award by $12,000');
  });

  it('reports months short when funds run out early', () => {
    const p = buildProjection(project, sixMonths, { method: 'trailing3', adjustPct: 100 });
    expect(p.runoutMonth).toBe('2026-10');
    expect(p.monthsShort).toBe(2);
    expect(headline(p)).toContain('2 months before the award ends');
  });

  it('flags underspending when the what-if cuts spending', () => {
    const p = buildProjection(project, sixMonths, { method: 'trailing3', adjustPct: -50 });
    expect(p.projectedEndSpend).toBe(90_000);
    expect(p.status).toBe('underspent');
  });

  it('counts empty months as zero in the trailing window', () => {
    const gap = sixMonths.filter((e) => e.month !== '2026-05' && e.month !== '2026-06');
    const withLateCharge: Expense[] = [...gap, { projectId: 'P1', month: '2026-06', category: 'Travel', amount: 3_000 }];
    const p = buildProjection(project, withLateCharge);
    expect(p.baseBurn).toBeCloseTo((10_000 + 0 + 3_000) / 3);
  });

  it('builds a continuous chart series', () => {
    const p = buildProjection(project, sixMonths);
    expect(p.series).toHaveLength(12);
    expect(p.series[5]).toMatchObject({ month: '2026-06', actual: 60_000, projected: 60_000 });
    expect(p.series[6]).toMatchObject({ month: '2026-07', actual: null, projected: 70_000 });
    expect(p.series[11]?.projected).toBe(120_000);
    expect(p.series[11]?.plan).toBe(120_000);
  });

  it('sorts categories by spend', () => {
    const mixed: Expense[] = [
      { projectId: 'P1', month: '2026-01', category: 'Travel', amount: 1_000 },
      { projectId: 'P1', month: '2026-01', category: 'Salaries', amount: 9_000 },
    ];
    const p = buildProjection(project, mixed);
    expect(p.categories.map((c) => c.category)).toEqual(['Salaries', 'Travel']);
    expect(p.categories[0]?.share).toBeCloseTo(0.9);
  });

  it('handles an award with no statements yet', () => {
    const p = buildProjection(project, []);
    expect(p.spent).toBe(0);
    expect(p.burn).toBe(0);
    expect(p.status).toBe('underspent');
  });
});

describe('statusFor', () => {
  it('uses clear thresholds', () => {
    expect(statusFor(100_001, 100_000)).toBe('over');
    expect(statusFor(98_000, 100_000)).toBe('watch');
    expect(statusFor(90_000, 100_000)).toBe('on-track');
    expect(statusFor(60_000, 100_000)).toBe('underspent');
  });
});
