import { 
  IncomeItem, 
  CarPlan, 
  FixedObligation, 
  InstallmentPlan, 
  ExpenseRecord, 
  SavingsItem, 
  LiabilityItem, 
  ReceivableRecord, 
  MonthlyRecord,
  AccountBalancesState,
  FinancialTransaction
} from './types';

export interface UserFinancialMetrics {
  openingBalance: number;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
}

export interface UserFinancialSettings {
  currency: 'SAR' | 'USD' | 'EUR' | 'AED';
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY';
  isMaskedByDefault: boolean;
  budgetAlertThreshold: number; // percentage (e.g. 80)
}

export interface UserProfile extends UserFinancialMetrics {
  userId: string;
  email?: string | null;
  displayName?: string | null;
  isSetupComplete: boolean;
  settings?: UserFinancialSettings;
  createdAt: string;
  updatedAt: string;
}

export interface CleanSlateFinancialState {
  userId: string;
  incomes: IncomeItem[];
  carPlan: CarPlan;
  fixedObligations: FixedObligation[];
  installments: InstallmentPlan[];
  expenses: ExpenseRecord[];
  savings: SavingsItem[];
  liabilities: LiabilityItem[];
  receivables: ReceivableRecord[];
  monthlyData: MonthlyRecord[];
  accountBalances: AccountBalancesState;
  transactions: FinancialTransaction[];
  openingBalance: number;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  isSetupComplete: boolean;
  updatedAt: string;
}
