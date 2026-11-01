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
  incomes: any[];
  carPlan: {
    monthlyInstallment: number;
    totalInstallments: number;
    paidInstallments: number;
    balloonPayment: number;
    isPaidThisMonth: boolean;
  };
  fixedObligations: any[];
  installments: any[];
  expenses: any[];
  savings: any[];
  liabilities: any[];
  receivables: any[];
  monthlyData: any[];
  accountBalances: {
    checkingBalance: number;
    savingsBalance: number;
    emergencyTarget: number;
    isMasked: boolean;
    lastUpdated: string;
  };
  transactions: any[];
  openingBalance: number;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  isSetupComplete: boolean;
  updatedAt: string;
}
