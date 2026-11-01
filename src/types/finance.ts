export type FrequencyType = 'monthly' | 'one-time' | 'one_time';

export interface IncomeItem {
  id: string;
  title: string;
  amount: number;
  frequency: FrequencyType;
  category: 'راتب أساسي' | 'عمل حر / استشارات' | 'أرباح واستثمارات' | 'مكافآت وحوافز' | 'أخرى';
  isRecurring: boolean;
  notes?: string;
}

export interface CarPlan {
  monthlyInstallment: number;
  totalInstallments: number;
  paidInstallments: number;
  balloonPayment: number;
  isPaidThisMonth?: boolean;
  notes?: string;
}

export interface FixedObligation {
  id: string;
  title: string;
  amount: number;
  category: 'سيارة' | 'سكن وإيجار' | 'بنزين وتشغيل' | 'فواتير منزل' | 'تأمين' | 'أخرى';
  dueDay?: number;
  isPaidThisMonth?: boolean;
  notes?: string;
}

export type PlatformType = 'Tamara' | 'Tabby' | 'Bank' | 'Other';

export interface InstallmentRecord {
  id: string;
  name: string;
  platform: PlatformType;
  amount: number;
  start: string;
  end: string;
  remainingMonths: number;
  totalMonths?: number;
  paidMonths?: number;
  isPaidThisMonth?: boolean;
  remainingNote?: string;
  status: 'active' | 'completed';
  category?: string;
}

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
  | 'أخرى';

export type PaymentMethod = 
  | 'مدى / بطاقة بنكية'
  | 'أبل باي (Apple Pay)'
  | 'كاش'
  | 'تمارا'
  | 'تابي'
  | 'تحويل بنكي';

export interface ExpenseRecord {
  id: string;
  desc: string;
  amount: number;
  category: ExpenseCategory;
  method: PaymentMethod;
  date: string;
  type?: 'EXPENSE' | 'TOP_UP' | 'ADJUSTMENT';
}

export interface SavingsItem {
  id: string;
  title: string;
  amount: number;
  category: 'صندوق طوارئ' | 'استثمار ونمو' | 'مخصص الدفعة الأخيرة للسيارة' | 'ادخار عام';
  date: string;
  notes?: string;
}

export interface LiabilityItem {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  category: 'دفعة سيارة أخيرة' | 'دين شخصي' | 'قرض بنكي' | 'التزام مؤجل';
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

export interface MonthlyRecord {
  id: string;
  month: string;
  salary: number;
  car: number;
  home: number;
  gas: number;
  tamara: number;
  tabby: number;
  personalExpensesBudget?: number;
  savingsBudget?: number;
  note?: string;
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

export interface UnifiedAppState {
  accounts: AccountBalancesState;
  installments: InstallmentRecord[];
  expenses: ExpenseRecord[];
  savings: SavingsItem[];
  incomes: IncomeItem[];
  fixedObligations: FixedObligation[];
  carPlan: CarPlan;
  receivables: ReceivableRecord[];
  monthlyData: MonthlyRecord[];
  transactions: FinancialTransaction[];
}

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
