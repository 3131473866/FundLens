import { describe, expect, it } from 'vitest';
import { parseAmount, parseStatement, StatementError } from './parseStatement';

const HEADER = 'project_id,project_name,pi,award_total,start_month,end_month,month,category,amount';

describe('parseAmount', () => {
  it('handles currency formatting', () => {
    expect(parseAmount('$1,200.50')).toBe(1200.5);
    expect(parseAmount('(300)')).toBe(-300);
    expect(parseAmount('-45')).toBe(-45);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('n/a')).toBeNull();
  });
});

describe('parseStatement', () => {
  it('parses a valid statement into projects and expenses', () => {
    const csv = [
      HEADER,
      'A1,Alpha,Dr. X,"$100,000",2026-01,2026-12,2026-01,Salaries,5000',
      'A1,Alpha,Dr. X,"$100,000",2026-01,2026-12,2026-02,Travel,"1,250.50"',
    ].join('\n');
    const { ledger, warnings } = parseStatement(csv);
    expect(warnings).toEqual([]);
    expect(ledger.projects).toEqual([
      { id: 'A1', name: 'Alpha', pi: 'Dr. X', awardTotal: 100_000, startMonth: '2026-01', endMonth: '2026-12' },
    ]);
    expect(ledger.expenses).toHaveLength(2);
    expect(ledger.expenses[1]).toEqual({ projectId: 'A1', month: '2026-02', category: 'Travel', amount: 1250.5 });
  });

  it('accepts alternate header names and date formats', () => {
    const csv = ['Account,Period,Expense Category,Actual,Award Amount,End Date', 'B2,3/2026,Supplies,$400,50000,12/31/2027'].join('\n');
    const { ledger } = parseStatement(csv);
    expect(ledger.projects[0]).toMatchObject({ id: 'B2', name: 'B2', awardTotal: 50_000, endMonth: '2027-12', startMonth: '2026-03' });
    expect(ledger.expenses[0]?.month).toBe('2026-03');
  });

  it('skips bad rows with a line-numbered warning instead of failing', () => {
    const csv = [
      HEADER,
      'A1,Alpha,,100000,,2026-12,2026-01,Salaries,5000',
      'A1,Alpha,,100000,,2026-12,not-a-month,Salaries,5000',
      'A1,Alpha,,100000,,2026-12,2026-02,Salaries,abc',
    ].join('\n');
    const { ledger, warnings } = parseStatement(csv);
    expect(ledger.expenses).toHaveLength(1);
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toContain('Line 3');
    expect(warnings[1]).toContain('Line 4');
  });

  it('names missing required columns', () => {
    expect(() => parseStatement('project_id,month,amount\nA,2026-01,5')).toThrow(StatementError);
    expect(() => parseStatement('project_id,month,amount\nA,2026-01,5')).toThrow(/category, award_total, end_month/);
  });

  it('drops projects that have no valid award total', () => {
    const csv = [HEADER, 'A1,Alpha,,,,2026-12,2026-01,Salaries,5000', 'B1,Beta,,90000,,2026-12,2026-01,Salaries,100'].join('\n');
    const { ledger, warnings } = parseStatement(csv);
    expect(ledger.projects.map((p) => p.id)).toEqual(['B1']);
    expect(ledger.expenses.every((e) => e.projectId === 'B1')).toBe(true);
    expect(warnings.some((w) => w.includes('A1'))).toBe(true);
  });
});
