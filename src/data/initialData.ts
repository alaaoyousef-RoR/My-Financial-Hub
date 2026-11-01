import { 
  IncomeItem, 
  CarPlan, 
  FixedObligation, 
  InstallmentRecord, 
  ExpenseRecord, 
  SavingsItem, 
  LiabilityItem, 
  ReceivableRecord, 
  MonthlyRecord,
  AccountBalancesState
} from '../types/finance';

/**
 * Clean Slate Default Data Architecture
 * All entities default to clean zeros and empty arrays for a pristine, unpopulated template.
 */

export const INITIAL_ACCOUNT_BALANCES: AccountBalancesState = {
  checkingBalance: 0,
  savingsBalance: 0,
  emergencyTarget: 0,
  lastUpdated: new Date().toISOString()
};

export const INITIAL_INCOMES: IncomeItem[] = [];

export const INITIAL_CAR_PLAN: CarPlan = {
  monthlyInstallment: 0,
  totalInstallments: 0,
  paidInstallments: 0,
  balloonPayment: 0,
  notes: ''
};

export const INITIAL_FIXED_OBLIGATIONS: FixedObligation[] = [];

export const INITIAL_INSTALLMENTS: InstallmentRecord[] = [];

export const INITIAL_EXPENSES: ExpenseRecord[] = [];

export const INITIAL_SAVINGS: SavingsItem[] = [];

export const INITIAL_LIABILITIES: LiabilityItem[] = [];

export const INITIAL_RECEIVABLES: ReceivableRecord[] = [];

import { generateTimelineMonths } from '../utils/dateFilters';

export const INITIAL_MONTHLY_DATA: MonthlyRecord[] = generateTimelineMonths(0, 14).map((m, idx) => ({
  id: `m-${idx + 1}`,
  month: m.name,
  salary: 0,
  car: 0,
  home: 0,
  gas: 0,
  tamara: 0,
  tabby: 0,
  note: m.milestoneTag || ''
}));
