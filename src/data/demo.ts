import type { Expense, Project } from '../types';
import { listMonths } from '../lib/months';

/**
 * Synthetic data only. Deterministic (seeded) so screenshots, tests and demos are repeatable.
 * Names are invented; nothing here comes from a real institution.
 */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LAST_STATEMENT = '2026-08';

interface Profile extends Project {
  monthly: number;
  growth: number;
  seed: number;
}

const PROFILES: Profile[] = [
  { id: 'NSF-2311', name: 'Adaptive signal timing study', pi: 'Dr. Lena Ortiz', awardTotal: 900_000, startMonth: '2024-01', endMonth: '2027-06', monthly: 19_500, growth: 0.01, seed: 11 },
  { id: 'DOT-4478', name: 'Freight corridor analytics', pi: 'Dr. Marcus Bell', awardTotal: 600_000, startMonth: '2025-01', endMonth: '2027-12', monthly: 13_000, growth: 0, seed: 22 },
  { id: 'MDOT-2090', name: 'Work zone safety sensors', pi: 'Dr. Priya Nair', awardTotal: 450_000, startMonth: '2024-07', endMonth: '2027-06', monthly: 11_500, growth: 0, seed: 33 },
  { id: 'USDOT-7712', name: 'Transit reliability dashboards', pi: 'Dr. Samuel Okafor', awardTotal: 320_000, startMonth: '2023-09', endMonth: '2026-12', monthly: 7_800, growth: 0, seed: 44 },
];

const CATEGORIES: { name: string; weight: number }[] = [
  { name: 'Salaries', weight: 0.46 },
  { name: 'Fringe benefits', weight: 0.14 },
  { name: 'Graduate tuition', weight: 0.12 },
  { name: 'Travel', weight: 0.08 },
  { name: 'Supplies', weight: 0.06 },
  { name: 'Equipment', weight: 0.04 },
  { name: 'Subawards', weight: 0.07 },
  { name: 'Other', weight: 0.03 },
];

function generate(p: Profile): Expense[] {
  const rand = mulberry32(p.seed);
  const out: Expense[] = [];
  listMonths(p.startMonth, LAST_STATEMENT).forEach((month, i) => {
    const monthBase = p.monthly * (1 + p.growth) ** i;
    for (const c of CATEGORIES) {
      let base = monthBase * c.weight;
      if (c.name === 'Travel') base *= rand() < 0.35 ? 2.8 : 0.2; // trips are lumpy
      if (c.name === 'Equipment') base *= i < 6 ? 6 : 0.15; // bought early in the award
      if (c.name === 'Subawards') base = i % 3 === 2 ? base * 3 : 0; // billed quarterly
      const amount = Math.round((base * (0.92 + rand() * 0.16)) / 10) * 10;
      if (amount > 0) out.push({ projectId: p.id, month, category: c.name, amount });
    }
  });
  return out;
}

export const DEMO_PROJECTS: Project[] = PROFILES.map(({ monthly: _m, growth: _g, seed: _s, ...project }) => project);
export const DEMO_EXPENSES: Expense[] = PROFILES.flatMap(generate);
