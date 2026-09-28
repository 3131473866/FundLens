import { describe, expect, it } from 'vitest';
import { addMonths, listMonths, monthsBetween, normalizeMonth } from './months';

describe('months', () => {
  it('adds months across year boundaries', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });

  it('counts months between keys', () => {
    expect(monthsBetween('2026-01', '2026-12')).toBe(11);
    expect(monthsBetween('2026-06', '2026-01')).toBe(-5);
  });

  it('lists months inclusively', () => {
    expect(listMonths('2026-11', '2027-01')).toEqual(['2026-11', '2026-12', '2027-01']);
  });

  it.each([
    ['2026-03', '2026-03'],
    ['2026-3-15', '2026-03'],
    ['3/2026', '2026-03'],
    ['03/15/2026', '2026-03'],
    ['Mar 2026', '2026-03'],
    ['September 2026', '2026-09'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeMonth(input)).toBe(expected);
  });

  it('rejects things that are not months', () => {
    expect(normalizeMonth('2026-13')).toBeNull();
    expect(normalizeMonth('hello')).toBeNull();
    expect(normalizeMonth('')).toBeNull();
  });
});
