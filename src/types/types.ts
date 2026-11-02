/**
 * Standardized, Strongly Typed Financial Domain Schema
 * Single Source of Truth for Personal Financial Dashboard.
 * Strictly typed interfaces with zero 'any' usage.
 */

// ==========================================
// 1. Core Enumerations & Status Types
// ==========================================

export type MonthStatus = 
  | 'locked'
  | 'active'
  | 'forecast'
  | 'HISTORICAL_CLOSED'
  | 'ACTIVE_CURRENT'
  | 'FUTURE_PROJECTION';

export type TransactionType = 
  | 'income'
  | 'expense'
  | 'INCOME'
  | 'EXPENSE'
  | 'OBLIGATION'
  | 'TRANSFER'
  | 'TOP_UP'
  | 'ADJUSTMENT';

export type RecurrencePattern = 
  | 'ONE_TIME'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUALLY';

export type FrequencyType = 'monthly' | 'one-time' | 'one_time' | 'MONTHLY' | 'ONE_TIME';

export type PlatformType = 'Tamara' | 'Tabby' | 'Bank' | 'Other';

// Standardized Category Definitions
export type ExpenseCategory = 
  | 'طعام ومقاهي'
  | 'تسوق وشخصي'
  | 'بنزين وسيارة'
  | 'فواتير وخدمات'
  | 'سكن ومستلزمات'
  | 'صحة وصيدلية'
  | 'صحة وعناية'
  | 'ترفيه وخروجات'
  | 'تغذية مخصص'
  | 'أخرى'
  | string;

export type IncomeCategory = 
  | 'راتب أساسي' 
  | 'عمل حر / استشارات' 
  | 'أرباح واستثمارات' 
  | 'مكافآت وحوافز' 
  | 'PRIMARY_SALARY'
  | 'FREELANCE'
  | 'INVESTMENT'
  | 'BONUS'
  | 'أخرى'
  | string;

export type FixedObligationCategory = 
  | 'سيارة' 
  | 'سكن وإيجار' 
  | 'بنزين وتشغيل' 
  | 'فواتير منزل' 
  | 'تأمين' 
  | 'أخرى'
  | string;

export type SavingsCategory = 
  | 'صندوق طوارئ' 
  | 'استثمار ونمو' 
  | 'مخصص الدفعة الأخيرة للسيارة' 
  | 'ادخار عام'
  | string;

export type LiabilityCategory = 
  | 'دفعة سيارة أخيرة' 
  | 'دين شخصي' 
  | 'قرض بنكي' 
  | 'التزام مؤجل'
  | string;

export type PaymentMethod = 
  | 'مدى / بطاقة بنكية'
  | 'أبل باي (Apple Pay)'
  | 'كاش'
  | 'تمارا'
  | 'تابي'
  | 'تحويل بنكي'
  | 'BANK_TRANSFER'
  | 'DEBIT_CARD'
  | 'CASH'
  | 'APPLE_PAY'
  | 'CREDIT_CARD';

export type AccountType = 'checking' | 'savings' | 'external' | 'CHECKING' | 'SAVINGS' | 'EXTERNAL';

// Settlement execution method for installments and loans
export type SettlementMethod = 'CHECKING_ACCOUNT' | 'EXTERNAL' | 'PREPAID';

// ==========================================
// 2. Discrete Item Definitions
// ==========================================

export interface Transaction {
  id: string;
  date: string; // ISO format: YYYY-MM-DD
  category: string;
  amount: number;
  type: 'income' | 'expense' | TransactionType;
  description: string;

  // Domain & ledger extensions
  title?: string;
  monthKey?: string;
  paymentMethod?: PaymentMethod;
  status?: 'PENDING' | 'CLEARED' | 'RECONCILED';
  sourceAccount?: AccountType;
  destinationAccount?: AccountType;
  referenceId?: string;
  isRecurring?: boolean;
  recurrenceRule?: RecurrencePattern;
  notes?: string;
  createdAt?: string;
}

export interface InstallmentPlan {
  id: string;
  name: string;
  totalAmount?: number;
  monthlyPayment?: number;
  amount: number;
  remainingMonths: number;
  startDate?: string;
  start: string;
  end: string;

  // Multi-platform & tracking properties
  platform?: PlatformType;
  totalMonths?: number;
  paidMonths?: number;
  dueDay?: number;
  isPaidThisMonth?: boolean;
  remainingNote?: string;
  status?: 'active' | 'completed';
  category?: string;

  // Settlement & Prepayment attributes
  paymentMethod?: SettlementMethod;
  lastPaymentMethod?: SettlementMethod;
  isPrepaid?: boolean;
  paidExternally?: boolean;
  settlementDate?: string;
}

export type InstallmentRecord = InstallmentPlan;

export interface CarPlan {
  id?: string;
  name?: string;
  totalCost?: number;
  monthlyInstallment: number;
  insurance?: number;
  maintenanceReserve?: number;

  totalInstallments: number;
  paidInstallments: number;
  balloonPayment: number;
  isPaidThisMonth?: boolean;
  notes?: string;

  // Settlement & Prepayment tracking
  paymentMethod?: SettlementMethod;
  lastPaymentMethod?: SettlementMethod;
  isPrepaid?: boolean;
  paidExternally?: boolean;
  lastSettlementDate?: string;
}

// Multi-month simulated installment contract projection
export interface SimulatedInstallmentItem {
  id: string;
  name: string;
  platform: PlatformType;
  monthlyAmount: number;
  totalAmount: number;
  tenureMonths: number;
  paidMonthsAtTarget: number;
  remainingMonthsAtTarget: number;
  isActiveInTargetMonth: boolean;
  projectedDueInTargetMonth: number;
  remainingDebtAtTarget: number;
  startDate: string;
  endDate: string;
  isSettled: boolean;
  isPrepaid?: boolean;
  paidExternally?: boolean;
  lastPaymentMethod?: SettlementMethod;
}

export interface BNPLMonthlySimulation {
  targetMonthYear: string;
  baseMonthYear: string;
  monthOffset: number;
  totalUpcomingDues: number;
  tamaraUpcomingDues: number;
  tabbyUpcomingDues: number;
  activeInstallmentsCount: number;
  completedInstallmentsCount: number;
  totalRemainingDebt: number;
  installments: SimulatedInstallmentItem[];
}

export type AllowanceHealthStatus = 'HEALTHY' | 'TIGHT' | 'DEFICIT';

export interface DynamicAllowanceResult {
  checkingBalance: number;
  remainingFixedLiabilities: number;
  availableAllowancePool: number;
  daysRemainingInMonth: number;
  dailyAllowance: number;
  weeklyAllowance: number;
  status: AllowanceHealthStatus;
  burnRateExplanation: string;
}

export interface ExpenseRecord {
  id: string;
  desc: string;
  amount: number;
  category: ExpenseCategory;
  method: PaymentMethod;
  date: string;
  type?: 'EXPENSE' | 'TOP_UP' | 'ADJUSTMENT';
}

export interface IncomeItem {
  id: string;
  title: string;
  sourceName?: string;
  amount: number;
  frequency: FrequencyType;
  category: IncomeCategory;
  isRecurring: boolean;
  effectiveStartMonth?: string;
  effectiveEndMonth?: string;
  notes?: string;
}

export interface FixedObligation {
  id: string;
  title: string;
  amount: number;
  category: FixedObligationCategory;
  dueDay?: number;
  isPaidThisMonth?: boolean;
  notes?: string;
}

export interface SavingsItem {
  id: string;
  title: string;
  amount: number;
  category: SavingsCategory;
  date: string;
  notes?: string;
}

export interface LiabilityItem {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  category: LiabilityCategory;
  status: 'مستحق' | 'مسدد';
  notes?: string;
}

export interface ReceivableRecord {
  id: string;
  name: string;
  amount: number;
  status: 'معلق' | 'تم التحصيل' | 'مستلم';
  date: string;
  notes?: string;
  routedTo?: 'income' | 'bnpl_payoff' | 'savings';
}

export interface AccountBalancesState {
  checkingBalance: number;
  savingsBalance: number;
  emergencyTarget?: number;
  lastUpdated?: string;
  isMasked?: boolean;
}

export interface FinancialTransaction {
  id: string;
  type: 'bnpl_installment' | 'savings_deposit' | 'expense' | 'income' | 'car_installment';
  title: string;
  amount: number;
  date: string;
  sourceAccount: 'checking' | 'savings' | 'external';
  destinationAccount?: 'checking' | 'savings' | 'external';
  relatedId?: string;
  notes?: string;
}

// ==========================================
// 3. Partitioned Monthly Ledger Schema
// ==========================================

export interface MonthlyRecordSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;

  totalFixedObligations?: number;
  totalBNPLInstallments?: number;
  totalPersonalExpenses?: number;
  totalSavingsAllocations?: number;
  discretionaryFreeCash?: number;
  netSavingsRatePercentage?: number;
}

export interface MonthlyObligationSnapshot {
  obligationId: string;
  title: string;
  platformOrCategory: string;
  amountPaid: number;
  remainingInstallmentsAfterMonth: number;
  remainingAfterPayment?: number;
  isSettled: boolean;
}

export interface MonthlyRecord {
  monthId: string;
  status: 'locked' | 'active' | 'forecast' | MonthStatus;
  transactions: Transaction[];
  installments: InstallmentPlan[];
  plans: CarPlan[];
  summary: MonthlyRecordSummary;

  // Domain partition & backward compatibility fields
  monthKey?: string;
  label?: string;
  year?: number;
  monthIndex?: number;
  isLocked?: boolean;
  openingBalances?: {
    checking: number;
    savings: number;
  };
  closingBalances?: {
    checking: number;
    savings: number;
  };
  obligationsSnapshot?: MonthlyObligationSnapshot[];
  metadata?: {
    finalizedAt?: string;
    closedAt?: string;
    lastModifiedAt?: string;
    notes?: string;
  };
  id?: string;
  month?: string;
  salary?: number;
  car?: number;
  home?: number;
  gas?: number;
  tamara?: number;
  tabby?: number;
  note?: string;
}

export type MonthlyLedger = Record<string, MonthlyRecord>;

// ==========================================
// 4. Forecasting & Projection Model
// ==========================================

export interface ForecastingInputs {
  baselineMonthlySalary: number;
  fixedMonthlyObligationsCap: number;
  discretionarySpendingCap: number;
  targetSavingsPercentage: number;
  expectedAnnualIncomeGrowthPct: number;
}

export interface ProjectedMonth {
  monthKey: string;
  monthOffset: number;
  forecastedIncome: number;
  forecastedFixedCosts: number;
  forecastedVariableExpenses: number;
  forecastedNetLiquidity: number;
  projectedCumulativeSavings: number;
  activeObligationsRemaining: number;
  milestoneTag?: string;
}

export interface ProjectionModel {
  modelId: string;
  generatedAt: string;
  baseMonthKey: string;
  simulationHorizonMonths: number;
  inputs: ForecastingInputs;
  projections: ProjectedMonth[];
}

// ==========================================
// 5. Data Import / Export Envelope
// ==========================================

export interface FinancialDataExportEnvelope {
  schemaVersion: '2.0.0';
  exportedAt: string;
  profileMetadata: {
    currency: string;
    locale: string;
    totalMonthsArchived: number;
  };
  accounts: AccountBalancesState;
  monthlyLedger: MonthlyLedger;
  recurringTemplates: {
    incomes: IncomeItem[];
    fixedObligations?: FixedObligation[];
    installments?: InstallmentPlan[];
    carPlan?: CarPlan;
    obligations?: Array<{
      id: string;
      title: string;
      totalCommitmentAmount?: number;
      monthlyInstallment: number;
      totalInstallments: number;
      remainingInstallments: number;
      provider?: string;
      category: string;
      startMonthKey?: string;
      endMonthKey?: string;
      dueDayOfMonth?: number;
      isPaidThisMonth?: boolean;
      balloonPayment?: number;
    }>;
  };
  forecastBaseline: ProjectionModel;
}

// ==========================================
// 6. Navigation & UI Context State
// ==========================================

export interface MonthItem {
  id: string;
  name: string;
  year: number;
  monthIndex: number;
  isCurrentMonth: boolean;
  isFuture: boolean;
  isPast: boolean;
  yearMonth?: string;
  monthOffset?: number;
  milestoneTag?: string;
}

export interface MonthContextState {
  selectedMonth: MonthItem;
  selectedMonthIndex: number;
  availableMonths: MonthItem[];
  isReadOnlySimulation: boolean;
  currentYearMonth: string;
  selectedYearMonth: string;
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  goToCurrentMonth: () => void;
  selectMonthByIndex: (index: number) => void;
  selectMonthByYearMonth: (yearMonth: string) => void;
}
