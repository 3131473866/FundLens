/** Months are always "YYYY-MM" strings so they sort and compare lexically. */
export type MonthKey = string;

export interface Project {
  id: string;
  name: string;
  pi?: string;
  /** Total award ceiling in dollars. */
  awardTotal: number;
  startMonth: MonthKey;
  endMonth: MonthKey;
}

export interface Expense {
  projectId: string;
  month: MonthKey;
  category: string;
  amount: number;
}

export interface Ledger {
  projects: Project[];
  expenses: Expense[];
}
