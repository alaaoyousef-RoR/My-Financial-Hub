/**
 * Backward-Compatible Domain Schema Adapter
 * Re-exports canonical definitions from `src/types/types.ts`.
 */

export type { UserProfile, UserFinancialSettings } from './userProfile';

// Re-export canonical domain types from types.ts
export type {
  MonthStatus,
  TransactionType,
  RecurrencePattern,
  FrequencyType,
  PlatformType,
  ExpenseCategory,
  IncomeCategory,
  FixedObligationCategory,
  SavingsCategory,
  LiabilityCategory,
  PaymentMethod,
  AccountType,
  Transaction,
  InstallmentPlan,
  InstallmentRecord,
  ExpenseRecord,
  FixedObligation,
  CarPlan,
  IncomeItem,
  SavingsItem,
  LiabilityItem,
  ReceivableRecord,
  AccountBalancesState,
  FinancialTransaction,
  MonthlyRecordSummary,
  MonthlyObligationSnapshot,
  MonthlyLedger,
  ForecastingInputs,
  ProjectedMonth,
  ProjectionModel,
  FinancialDataExportEnvelope,
  MonthItem,
  MonthContextState,
  SettlementMethod,
  InstallmentItemStatus,
  InstallmentScheduleItem,
  SimulatedInstallmentItem,
  BNPLMonthlySimulation,
  AllowanceHealthStatus,
  DynamicAllowanceResult,
  WeeklyAllowanceBreakdown,
  MultiWeekAllowanceResult
} from './types';

export type { MonthlyRecord as CanonicalMonthlyRecord } from './types';

// Timeline / projection interface used by existing dashboard charts, tables and KPI cards
export interface MonthlyRecord {
  id: string;
  month: string;
  salary: number;
  car: number;
  home: number;
  gas: number;
  tamara: number;
  tabby: number;
  note?: string;
  monthKey?: string;
  label?: string;
  year?: number;
  monthIndex?: number;
  status?: import('./types').MonthStatus;
  isLocked?: boolean;
}

export interface UnifiedAppState {
  accounts: import('./types').AccountBalancesState;
  installments: import('./types').InstallmentPlan[];
  expenses: import('./types').ExpenseRecord[];
  savings: import('./types').SavingsItem[];
  incomes: import('./types').IncomeItem[];
  fixedObligations: import('./types').FixedObligation[];
  carPlan: import('./types').CarPlan;
  receivables: import('./types').ReceivableRecord[];
  monthlyData: MonthlyRecord[];
  transactions: import('./types').FinancialTransaction[];
}
