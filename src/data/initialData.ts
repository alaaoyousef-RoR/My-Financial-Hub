import { 
  Transaction,
  InstallmentPlan,
  CarPlan,
  MonthlyRecord,
  MonthlyLedger,
  ProjectionModel, 
  FinancialDataExportEnvelope,
  AccountBalancesState,
  IncomeItem,
  FixedObligation,
  ExpenseRecord,
  SavingsItem,
  LiabilityItem,
  ReceivableRecord
} from '../types/types';
import { generateTimelineMonths } from '../utils/dateFilters';
import { MonthlyRecord as TimelineMonthlyRecord } from '../types/finance';

/**
 * 1. Empty Zero-Based Template
 * Used for new user onboarding, profile initialization, and clean resets.
 */
export const emptyMonthlyRecord: MonthlyRecord = {
  monthId: '[EMPTY_MONTH_ID]',
  status: 'active',
  transactions: [],
  installments: [],
  plans: [],
  summary: {
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0
  }
};

/**
 * 2. Generic Mock Dataset: 3-Month Financial Cycle
 * Strictly generic placeholders ([INCOME_SOURCE], [EXPENSE_AMOUNT], etc.) with zero private data.
 * - Month 1: Locked historical month (closed balances & immutable ledger snapshot).
 * - Month 2: Active current month (in-progress operational cash flow & live entries).
 * - Month 3: Forecast future month (projected inflows, reduced debt schedules & savings targets).
 */
export const initialMonthlyRecords: MonthlyRecord[] = [
  // -------------------------------------------------------------
  // Month 1: Locked Historical Month (Previous Period Closed)
  // -------------------------------------------------------------
  {
    monthId: '2026-09',
    monthKey: '2026-09',
    label: '[PREVIOUS_MONTH_LABEL] 2026',
    year: 2026,
    monthIndex: 8,
    status: 'locked',
    isLocked: true,
    openingBalances: {
      checking: 8500,
      savings: 20000
    },
    closingBalances: {
      checking: 11400,
      savings: 22000
    },
    transactions: [
      {
        id: 'tx-hist-001',
        date: '2026-09-27',
        category: 'PRIMARY_SALARY',
        amount: 15000,
        type: 'income',
        description: '[PRIMARY_EMPLOYER_SALARY_DEPOSIT]',
        title: '[PRIMARY_EMPLOYER_SALARY_DEPOSIT]',
        paymentMethod: 'BANK_TRANSFER',
        status: 'RECONCILED',
        sourceAccount: 'external',
        destinationAccount: 'checking'
      },
      {
        id: 'tx-hist-002',
        date: '2026-09-02',
        category: 'سكن ومستلزمات',
        amount: 2500,
        type: 'expense',
        description: '[RESIDENTIAL_HOUSING_LEASE]',
        title: '[RESIDENTIAL_HOUSING_LEASE]',
        paymentMethod: 'BANK_TRANSFER',
        status: 'RECONCILED',
        sourceAccount: 'checking'
      },
      {
        id: 'tx-hist-003',
        date: '2026-09-12',
        category: 'طعام ومقاهي',
        amount: 850,
        type: 'expense',
        description: '[GROCERY_AND_ESSENTIALS]',
        title: '[GROCERY_AND_ESSENTIALS]',
        paymentMethod: 'DEBIT_CARD',
        status: 'RECONCILED',
        sourceAccount: 'checking'
      },
      {
        id: 'tx-hist-004',
        date: '2026-09-18',
        category: 'بنزين وسيارة',
        amount: 400,
        type: 'expense',
        description: '[COMMUTE_FUEL_EXPENSE]',
        title: '[COMMUTE_FUEL_EXPENSE]',
        paymentMethod: 'APPLE_PAY',
        status: 'RECONCILED',
        sourceAccount: 'checking'
      },
      {
        id: 'tx-hist-005',
        date: '2026-09-28',
        category: 'استثمار ونمو',
        amount: 2000,
        type: 'expense',
        description: '[SAVINGS_RESERVE_ALLOCATION]',
        title: '[SAVINGS_RESERVE_ALLOCATION]',
        paymentMethod: 'BANK_TRANSFER',
        status: 'RECONCILED',
        sourceAccount: 'checking',
        destinationAccount: 'savings'
      }
    ],
    installments: [
      {
        id: 'inst-hist-001',
        name: '[BNPL_ELECTRONICS_PLAN]',
        totalAmount: 3200,
        monthlyPayment: 800,
        remainingMonths: 1,
        startDate: '2026-06-01',
        start: '2026-06',
        end: '2026-10',
        platform: 'Tamara',
        amount: 800,
        status: 'active'
      },
      {
        id: 'inst-hist-002',
        name: '[BNPL_FURNITURE_PURCHASE]',
        totalAmount: 2000,
        monthlyPayment: 500,
        remainingMonths: 2,
        startDate: '2026-07-15',
        start: '2026-07',
        end: '2026-11',
        platform: 'Tabby',
        amount: 500,
        status: 'active'
      }
    ],
    plans: [
      {
        id: 'car-hist-001',
        name: '[VEHICLE_AUTO_FINANCING]',
        totalCost: 108000,
        monthlyInstallment: 1800,
        insurance: 350,
        maintenanceReserve: 200,
        totalInstallments: 60,
        paidInstallments: 51,
        balloonPayment: 25000,
        isPaidThisMonth: true
      }
    ],
    summary: {
      totalIncome: 15000,
      totalExpenses: 8400,
      netSavings: 6600,
      totalFixedObligations: 4650,
      totalBNPLInstallments: 1300,
      totalPersonalExpenses: 1250,
      totalSavingsAllocations: 2000,
      discretionaryFreeCash: 4600,
      netSavingsRatePercentage: 13.33
    }
  },

  // -------------------------------------------------------------
  // Month 2: Active Current Month (Live Operational Tracking)
  // -------------------------------------------------------------
  {
    monthId: '2026-10',
    monthKey: '2026-10',
    label: '[CURRENT_MONTH_LABEL] 2026',
    year: 2026,
    monthIndex: 9,
    status: 'active',
    isLocked: false,
    openingBalances: {
      checking: 11400,
      savings: 22000
    },
    closingBalances: {
      checking: 13850,
      savings: 24000
    },
    transactions: [
      {
        id: 'tx-act-101',
        date: '2026-10-27',
        category: 'PRIMARY_SALARY',
        amount: 15000,
        type: 'income',
        description: '[PRIMARY_EMPLOYER_SALARY_DEPOSIT]',
        title: '[PRIMARY_EMPLOYER_SALARY_DEPOSIT]',
        paymentMethod: 'BANK_TRANSFER',
        status: 'CLEARED',
        sourceAccount: 'external',
        destinationAccount: 'checking'
      },
      {
        id: 'tx-act-102',
        date: '2026-10-02',
        category: 'سكن ومستلزمات',
        amount: 2500,
        type: 'expense',
        description: '[RESIDENTIAL_HOUSING_LEASE]',
        title: '[RESIDENTIAL_HOUSING_LEASE]',
        paymentMethod: 'BANK_TRANSFER',
        status: 'CLEARED',
        sourceAccount: 'checking'
      },
      {
        id: 'tx-act-103',
        date: '2026-10-10',
        category: 'فواتير وخدمات',
        amount: 450,
        type: 'expense',
        description: '[UTILITY_AND_INTERNET_SERVICE]',
        title: '[UTILITY_AND_INTERNET_SERVICE]',
        paymentMethod: 'DEBIT_CARD',
        status: 'CLEARED',
        sourceAccount: 'checking'
      },
      {
        id: 'tx-act-104',
        date: '2026-10-14',
        category: 'طعام ومقاهي',
        amount: 900,
        type: 'expense',
        description: '[GROCERY_AND_DINING_BUDGET]',
        title: '[GROCERY_AND_DINING_BUDGET]',
        paymentMethod: 'APPLE_PAY',
        status: 'CLEARED',
        sourceAccount: 'checking'
      },
      {
        id: 'tx-act-105',
        date: '2026-10-29',
        category: 'استثمار ونمو',
        amount: 2000,
        type: 'expense',
        description: '[MONTHLY_SAVINGS_TARGET]',
        title: '[MONTHLY_SAVINGS_TARGET]',
        paymentMethod: 'BANK_TRANSFER',
        status: 'CLEARED',
        sourceAccount: 'checking',
        destinationAccount: 'savings'
      }
    ],
    installments: [
      {
        id: 'inst-act-101',
        name: '[BNPL_ELECTRONICS_PLAN]',
        totalAmount: 3200,
        monthlyPayment: 800,
        remainingMonths: 0, // Final payment completed this month
        startDate: '2026-06-01',
        start: '2026-06',
        end: '2026-10',
        platform: 'Tamara',
        amount: 800,
        status: 'completed',
        isPaidThisMonth: true
      },
      {
        id: 'inst-act-102',
        name: '[BNPL_FURNITURE_PURCHASE]',
        totalAmount: 2000,
        monthlyPayment: 500,
        remainingMonths: 1,
        startDate: '2026-07-15',
        start: '2026-07',
        end: '2026-11',
        platform: 'Tabby',
        amount: 500,
        status: 'active',
        isPaidThisMonth: true
      }
    ],
    plans: [
      {
        id: 'car-act-001',
        name: '[VEHICLE_AUTO_FINANCING]',
        totalCost: 108000,
        monthlyInstallment: 1800,
        insurance: 350,
        maintenanceReserve: 200,
        totalInstallments: 60,
        paidInstallments: 52,
        balloonPayment: 25000,
        isPaidThisMonth: true
      }
    ],
    summary: {
      totalIncome: 15000,
      totalExpenses: 8500,
      netSavings: 6500,
      totalFixedObligations: 4650,
      totalBNPLInstallments: 1300,
      totalPersonalExpenses: 1350,
      totalSavingsAllocations: 2000,
      discretionaryFreeCash: 4500,
      netSavingsRatePercentage: 13.33
    }
  },

  // -------------------------------------------------------------
  // Month 3: Forecast Future Month (Simulation & Projections)
  // -------------------------------------------------------------
  {
    monthId: '2026-11',
    monthKey: '2026-11',
    label: '[FORECAST_MONTH_LABEL] 2026',
    year: 2026,
    monthIndex: 10,
    status: 'forecast',
    isLocked: false,
    openingBalances: {
      checking: 13850,
      savings: 24000
    },
    closingBalances: {
      checking: 17950,
      savings: 26500
    },
    transactions: [
      {
        id: 'tx-fc-201',
        date: '2026-11-27',
        category: 'PRIMARY_SALARY',
        amount: 15000,
        type: 'income',
        description: '[PROJECTED_SALARY_INCOME]',
        title: '[PROJECTED_SALARY_INCOME]',
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        sourceAccount: 'external',
        destinationAccount: 'checking'
      },
      {
        id: 'tx-fc-202',
        date: '2026-11-02',
        category: 'سكن ومستلزمات',
        amount: 2500,
        type: 'expense',
        description: '[PROJECTED_HOUSING_LEASE]',
        title: '[PROJECTED_HOUSING_LEASE]',
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        sourceAccount: 'checking'
      },
      {
        id: 'tx-fc-203',
        date: '2026-11-15',
        category: 'طعام ومقاهي',
        amount: 1200,
        type: 'expense',
        description: '[ESTIMATED_LIVING_EXPENSES]',
        title: '[ESTIMATED_LIVING_EXPENSES]',
        paymentMethod: 'DEBIT_CARD',
        status: 'PENDING',
        sourceAccount: 'checking'
      },
      {
        id: 'tx-fc-204',
        date: '2026-11-29',
        category: 'استثمار ونمو',
        amount: 2500,
        type: 'expense',
        description: '[EXPANDED_SAVINGS_TARGET]',
        title: '[EXPANDED_SAVINGS_TARGET]',
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        sourceAccount: 'checking',
        destinationAccount: 'savings'
      }
    ],
    installments: [
      // Electronics BNPL plan has ended; only 1 installment remains
      {
        id: 'inst-fc-201',
        name: '[BNPL_FURNITURE_PURCHASE]',
        totalAmount: 2000,
        monthlyPayment: 500,
        remainingMonths: 0, // Final payment during this projection cycle
        startDate: '2026-07-15',
        start: '2026-07',
        end: '2026-11',
        platform: 'Tabby',
        amount: 500,
        status: 'active'
      }
    ],
    plans: [
      {
        id: 'car-fc-001',
        name: '[VEHICLE_AUTO_FINANCING]',
        totalCost: 108000,
        monthlyInstallment: 1800,
        insurance: 350,
        maintenanceReserve: 200,
        totalInstallments: 60,
        paidInstallments: 53,
        balloonPayment: 25000,
        isPaidThisMonth: false
      }
    ],
    summary: {
      totalIncome: 15000,
      totalExpenses: 7050,
      netSavings: 7950,
      totalFixedObligations: 4650,
      totalBNPLInstallments: 500,
      totalPersonalExpenses: 1200,
      totalSavingsAllocations: 2500,
      discretionaryFreeCash: 5450,
      netSavingsRatePercentage: 16.67
    }
  }
];

// ============================================================================
// Backward-Compatible Application Baseline State
// Preserves seamless operation across UI components, Context, and Firestore.
// ============================================================================

export const INITIAL_ACCOUNT_BALANCES: AccountBalancesState = {
  checkingBalance: 0,
  savingsBalance: 0,
  emergencyTarget: 0,
  lastUpdated: new Date().toISOString()
};

export const INITIAL_INCOMES: IncomeItem[] = [];

export const INITIAL_CAR_PLAN: CarPlan = {
  id: 'car-default',
  name: '[VEHICLE_PLAN]',
  totalCost: 0,
  monthlyInstallment: 0,
  insurance: 0,
  maintenanceReserve: 0,
  totalInstallments: 0,
  paidInstallments: 0,
  balloonPayment: 0,
  notes: ''
};

export const INITIAL_FIXED_OBLIGATIONS: FixedObligation[] = [];

export const INITIAL_INSTALLMENTS: InstallmentPlan[] = [];

export const INITIAL_EXPENSES: ExpenseRecord[] = [];

export const INITIAL_SAVINGS: SavingsItem[] = [];

export const INITIAL_LIABILITIES: LiabilityItem[] = [];

export const INITIAL_RECEIVABLES: ReceivableRecord[] = [];

export const INITIAL_MONTHLY_DATA: TimelineMonthlyRecord[] = generateTimelineMonths(0, 14).map((m, idx) => ({
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

export const INITIAL_MONTHLY_LEDGER: MonthlyLedger = {
  '2026-09': initialMonthlyRecords[0],
  '2026-10': initialMonthlyRecords[1],
  '2026-11': initialMonthlyRecords[2]
};

export const GENERIC_SAMPLE_PREVIOUS_MONTH: MonthlyRecord = initialMonthlyRecords[0];
export const GENERIC_SAMPLE_CURRENT_MONTH: MonthlyRecord = initialMonthlyRecords[1];
export const GENERIC_SAMPLE_FORECAST_MONTH: MonthlyRecord = initialMonthlyRecords[2];

export const GENERIC_SAMPLE_PROJECTION_MODEL: ProjectionModel = {
  modelId: 'proj-model-baseline-2026',
  generatedAt: '2026-10-31T18:00:00Z',
  baseMonthKey: '2026-10',
  simulationHorizonMonths: 6,
  inputs: {
    baselineMonthlySalary: 15000,
    fixedMonthlyObligationsCap: 4300,
    discretionarySpendingCap: 6000,
    targetSavingsPercentage: 15,
    expectedAnnualIncomeGrowthPct: 5
  },
  projections: [
    {
      monthKey: '2026-11',
      monthOffset: 1,
      forecastedIncome: 15000,
      forecastedFixedCosts: 4300,
      forecastedVariableExpenses: 6000,
      forecastedNetLiquidity: 2700,
      projectedCumulativeSavings: 26250,
      activeObligationsRemaining: 2
    },
    {
      monthKey: '2026-12',
      monthOffset: 2,
      forecastedIncome: 15000,
      forecastedFixedCosts: 1800,
      forecastedVariableExpenses: 6000,
      forecastedNetLiquidity: 5200,
      projectedCumulativeSavings: 31450,
      activeObligationsRemaining: 1,
      milestoneTag: '[BNPL_FREEDOM_ACHIEVED]'
    },
    {
      monthKey: '2027-01',
      monthOffset: 3,
      forecastedIncome: 15750,
      forecastedFixedCosts: 1800,
      forecastedVariableExpenses: 6200,
      forecastedNetLiquidity: 5750,
      projectedCumulativeSavings: 37200,
      activeObligationsRemaining: 1,
      milestoneTag: '[ANNUAL_MERIT_ADJUSTMENT]'
    },
    {
      monthKey: '2027-02',
      monthOffset: 4,
      forecastedIncome: 15750,
      forecastedFixedCosts: 1800,
      forecastedVariableExpenses: 6200,
      forecastedNetLiquidity: 5750,
      projectedCumulativeSavings: 42950,
      activeObligationsRemaining: 1
    },
    {
      monthKey: '2027-03',
      monthOffset: 5,
      forecastedIncome: 15750,
      forecastedFixedCosts: 1800,
      forecastedVariableExpenses: 6200,
      forecastedNetLiquidity: 5750,
      projectedCumulativeSavings: 48700,
      activeObligationsRemaining: 1
    },
    {
      monthKey: '2027-04',
      monthOffset: 6,
      forecastedIncome: 15750,
      forecastedFixedCosts: 0,
      forecastedVariableExpenses: 6200,
      forecastedNetLiquidity: 7550,
      projectedCumulativeSavings: 56250,
      activeObligationsRemaining: 0,
      milestoneTag: '[TOTAL_DEBT_LIBERATION_MILESTONE]'
    }
  ]
};

export const GENERIC_FINANCIAL_DATASET: FinancialDataExportEnvelope = {
  schemaVersion: '2.0.0',
  exportedAt: '2026-10-31T18:00:00Z',
  profileMetadata: {
    currency: 'SAR',
    locale: 'ar-SA',
    totalMonthsArchived: 2
  },
  accounts: {
    checkingBalance: 13850,
    savingsBalance: 24000,
    emergencyTarget: 30000
  },
  monthlyLedger: INITIAL_MONTHLY_LEDGER,
  recurringTemplates: {
    incomes: [
      {
        id: 'inc-tmpl-01',
        title: '[PRIMARY_EMPLOYER_SALARY]',
        sourceName: '[PRIMARY_EMPLOYER_SALARY]',
        amount: 15000,
        frequency: 'monthly',
        category: 'PRIMARY_SALARY',
        isRecurring: true,
        effectiveStartMonth: '2026-01',
        notes: '[STANDARD_PAYROLL_INCOME]'
      }
    ],
    obligations: [
      {
        id: 'ob-tmpl-01',
        title: '[AUTO_FINANCING_LOAN]',
        totalCommitmentAmount: 108000,
        monthlyInstallment: 1800,
        totalInstallments: 60,
        remainingInstallments: 9,
        provider: '[AUTOMOTIVE_FINANCE_COMPANY]',
        category: 'AUTO_FINANCING',
        startMonthKey: '2022-04',
        endMonthKey: '2027-04',
        dueDayOfMonth: 28,
        isPaidThisMonth: true,
        balloonPayment: 25000
      }
    ]
  },
  forecastBaseline: GENERIC_SAMPLE_PROJECTION_MODEL
};
