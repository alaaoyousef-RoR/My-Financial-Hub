import React, { useState, useMemo, useEffect } from 'react';
import { ExpenseRecord, ExpenseCategory, PaymentMethod } from '../types/finance';
import { formatCurrency, triggerCelebration } from '../utils/formatters';
import { useFinancialState } from '../context/FinancialContext';
import { useMonthContext } from '../context/MonthContext';
import { 
  getCurrentYearMonth, 
  getDaysInMonth, 
  formatMonthLabel, 
  parseYearMonth, 
  filterByMonth, 
  isDateInMonth 
} from '../utils/dateFilters';
import { 
  computeWeeklyAllocations, 
  WeeklyBucketInput, 
  WeeklyAllocationResult 
} from '../utils/financialMath';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Coffee, 
  Fuel, 
  ShoppingCart, 
  Utensils, 
  Search, 
  CalendarDays,
  Pill,
  Tv,
  Wallet,
  ArrowUpRight,
  Clock,
  Layers,
  Zap,
  TrendingDown,
  RefreshCw,
  Scale,
  FileSpreadsheet
} from 'lucide-react';

interface ExpensesViewProps {
  expenses: ExpenseRecord[];
  discretionaryNet?: number;
  onAddClick: () => void;
  onQuickAdd: (desc: string, amount: number, category: ExpenseCategory, method: PaymentMethod, date?: string) => void;
  onDeleteExpense: (id: string) => void;
  isReadOnlySimulation?: boolean;
  onOpenStatementImportModal?: () => void;
}

interface WeeklyBucket {
  id: number;
  name: string;
  startDay: number;
  endDay: number;
  daysCount: number;
  weeklyCap: number;
  dailyAllowance: number;
  isActive: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  discretionaryNet = 2000,
  onAddClick,
  onQuickAdd,
  onDeleteExpense,
  isReadOnlySimulation = false,
  onOpenStatementImportModal
}) => {
  const { setExpenses, showToast } = useFinancialState();
  const monthContext = useMonthContext();

  const selectedYearMonth = monthContext?.selectedYearMonth || getCurrentYearMonth();
  const currentSystemYM = monthContext?.currentYearMonth || getCurrentYearMonth();
  const isSelectedCurrent = selectedYearMonth === currentSystemYM;
  const isSelectedPast = selectedYearMonth < currentSystemYM;
  const isSelectedFuture = selectedYearMonth > currentSystemYM;

  // Filter expenses strictly for the selected month to prevent cross-month pollution
  const activeMonthExpenses = useMemo(() => {
    return filterByMonth(expenses, selectedYearMonth);
  }, [expenses, selectedYearMonth]);

  // Live and selected month date calculations
  const now = new Date();
  const { year: currentYear, month: currentMonthNumber } = parseYearMonth(selectedYearMonth);
  const currentMonthName = formatMonthLabel(selectedYearMonth);
  const totalDaysInMonth = getDaysInMonth(selectedYearMonth);

  // Dynamic day of month: today for active month, total days for completed past month, 1 for future month
  const currentDay = isSelectedCurrent 
    ? now.getDate() 
    : isSelectedPast 
      ? totalDaysInMonth 
      : 1;

  // Monthly allowance target derived directly from FinancialContext
  const [customBudgetOverride, setCustomBudgetOverride] = useState<number | null>(null);
  const monthlyBudget = customBudgetOverride !== null 
    ? customBudgetOverride 
    : Math.max(Math.round(discretionaryNet || 0), 0);

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudgetInput, setTempBudgetInput] = useState(String(monthlyBudget));

  // Quick Macro Logging State
  const [macroAmount, setMacroAmount] = useState<string>('');
  const [macroDesc, setMacroDesc] = useState<string>('');
  const [macroCategory, setMacroCategory] = useState<ExpenseCategory>('طعام ومقاهي');
  
  // History table filters & collapse toggle
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [historyScope, setHistoryScope] = useState<'month' | 'all'>('month');

  // Save budget handler
  const handleSaveBudget = () => {
    const val = parseFloat(tempBudgetInput);
    if (!isNaN(val) && val >= 0) {
      setCustomBudgetOverride(val);
      setIsEditingBudget(false);
    }
  };

  // 1. Build the 5 Weekly Buckets dynamically
  const weeklyBuckets: WeeklyBucket[] = useMemo(() => {
    const dailyTarget = totalDaysInMonth > 0 ? monthlyBudget / totalDaysInMonth : 0;

    const rawBuckets = [
      { id: 1, name: 'الأسبوع الأول', startDay: 1, endDay: 7 },
      { id: 2, name: 'الأسبوع الثاني', startDay: 8, endDay: 14 },
      { id: 3, name: 'الأسبوع الثالث', startDay: 15, endDay: 21 },
      { id: 4, name: 'الأسبوع الرابع', startDay: 22, endDay: 28 },
      { id: 5, name: 'الأسبوع الخامس (ختام الشهر)', startDay: 29, endDay: totalDaysInMonth }
    ];

    return rawBuckets.map((b) => {
      const daysCount = Math.max(b.endDay - b.startDay + 1, 1);
      const weeklyCap = Math.round(dailyTarget * daysCount);
      const dailyAllowance = Math.round(weeklyCap / daysCount);
      const isActive = currentDay >= b.startDay && currentDay <= b.endDay;
      const isPast = currentDay > b.endDay;
      const isFuture = currentDay < b.startDay;

      return {
        ...b,
        daysCount,
        weeklyCap,
        dailyAllowance,
        isActive,
        isPast,
        isFuture
      };
    });
  }, [monthlyBudget, totalDaysInMonth, currentDay]);

  // Find the active week bucket
  const activeBucket = useMemo(() => {
    return weeklyBuckets.find(b => b.isActive) || weeklyBuckets[0];
  }, [weeklyBuckets]);

  // Week tab selection (defaults to active week)
  const [selectedWeekId, setSelectedWeekId] = useState<number>(activeBucket.id);

  // Helper to extract day of month from expense date
  const getExpenseDay = (dateStr: string): number => {
    if (!dateStr) return currentDay;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = parseInt(parts[2], 10);
      if (!isNaN(d)) return d;
    }
    const parsed = new Date(dateStr).getDate();
    return isNaN(parsed) ? currentDay : parsed;
  };

  // Derived genuine accumulated expenses for this month
  const accumulatedExpenses = useMemo(() => {
    return activeMonthExpenses
      .filter((e) => e.amount > 0 && e.category !== 'تغذية مخصص' && e.type !== 'TOP_UP')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [activeMonthExpenses]);

  // Derived top-ups for this month
  const totalTopUps = useMemo(() => {
    return activeMonthExpenses
      .filter((e) => e.type === 'TOP_UP' || e.category === 'تغذية مخصص' || e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(Number(e.amount) || 0), 0);
  }, [activeMonthExpenses]);

  // Derived real current allowance balance (Single source of truth from FinancialContext)
  const actualCurrentBalance = Math.max(
    Math.round((monthlyBudget + totalTopUps - accumulatedExpenses) * 100) / 100,
    0
  );

  // Dedicated permanent balance editing inline state
  const [isEditingActualBalance, setIsEditingActualBalance] = useState(false);
  const [tempActualBalanceInput, setTempActualBalanceInput] = useState<string>(String(actualCurrentBalance));

  // Sync temp input when actual balance reactively updates
  useEffect(() => {
    if (!isEditingActualBalance) {
      setTempActualBalanceInput(String(actualCurrentBalance));
    }
  }, [actualCurrentBalance, isEditingActualBalance]);

  // Calendar parameters for rebalancing
  const remainingDaysInMonth = Math.max(totalDaysInMonth - currentDay + 1, 1);
  const daysRemainingInActiveWeek = Math.max(activeBucket.endDay - currentDay + 1, 1);

  // Single source of truth calculation via computeWeeklyAllocations utility using isolated month expenses
  const allocationsOutput = useMemo(() => {
    return computeWeeklyAllocations({
      buckets: weeklyBuckets,
      expenses: activeMonthExpenses,
      actualCurrentBalance,
      monthlyBudget,
      currentDay,
      totalDaysInMonth
    });
  }, [weeklyBuckets, activeMonthExpenses, actualCurrentBalance, monthlyBudget, currentDay, totalDaysInMonth]);

  const {
    summaries: bucketSummaries,
    activeWeekRemaining: currentWeekRemaining,
    dailySafeLimit,
    calculatedTheoreticalBalance,
    activeSummary
  } = allocationsOutput;

  const safeToSpendToday = dailySafeLimit;

  // Selected week summary for detail view
  const selectedSummary = useMemo(() => {
    return bucketSummaries.find(s => s.bucket.id === selectedWeekId) || activeSummary;
  }, [bucketSummaries, selectedWeekId, activeSummary]);

  // Quick Top-up handler - updates FinancialContext directly
  const handleQuickTopUp = (amount: number, note?: string) => {
    if (isNaN(amount) || amount <= 0) return;

    const formattedDay = String(Math.min(currentDay, totalDaysInMonth)).padStart(2, '0');
    const targetDate = `${selectedYearMonth}-${formattedDay}`;

    const topUpRecord: ExpenseRecord = {
      id: `topup-${Date.now()}`,
      desc: note || `تغذية إضافية للمصروف (+${formatCurrency(amount)} ر.س)`,
      amount,
      category: 'تغذية مخصص',
      method: 'تحويل بنكي',
      type: 'TOP_UP',
      date: targetDate
    };

    setExpenses((prev: ExpenseRecord[]) => [topUpRecord, ...prev]);
    triggerCelebration();
    showToast?.(`تم إيداع +${formatCurrency(amount)} ر.س تغذية للمصروف بنجاح! 💰`);
  };

  // Balance Reconciliation & Allowance Top-Up State
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [actualBalanceInput, setActualBalanceInput] = useState<string>('');
  const [reconcileNote, setReconcileNote] = useState<string>('');

  const handleOpenReconcile = () => {
    setActualBalanceInput(String(actualCurrentBalance));
    setReconcileNote('');
    setIsReconcileOpen(true);
  };

  /**
   * Reconciles the allowance balance against actual cash/wallet balance.
   * Calculates difference = newActualAmount - actualCurrentBalance.
   * If difference < 0: logs an unrecorded expense without corrupting metrics.
   * If difference > 0: logs a top-up deposit without corrupting accumulated expenses.
   * Updates state atomically via FinancialContext.
   */
  const handleReconcileBalance = (newActualAmount: number) => {
    if (isNaN(newActualAmount) || newActualAmount < 0) {
      showToast?.('يرجى إدخال مبلغ صحيح للرصيد الفعلي المتوفر');
      return;
    }

    const difference = Math.round((newActualAmount - actualCurrentBalance) * 100) / 100;

    if (Math.abs(difference) < 0.01) {
      showToast?.('الرصيد الفعلي مطابق تماماً للرصيد المحسوب الحالي 👍');
      setIsReconcileOpen(false);
      return;
    }

    const targetBucket = activeBucket;
    const dayToUse = targetBucket.isActive 
      ? currentDay 
      : Math.min(targetBucket.startDay + 1, targetBucket.endDay);
    
    const formattedDay = String(Math.min(dayToUse, totalDaysInMonth)).padStart(2, '0');
    const targetDate = `${selectedYearMonth}-${formattedDay}`;

    if (difference < 0) {
      // Unrecorded expense deficit
      const deficitAmount = Math.abs(difference);
      const deficitRecord: ExpenseRecord = {
        id: `exp-deficit-${Date.now()}`,
        desc: reconcileNote.trim() || `تسوية رصيد (عجز مصروفات غير مسجلة -${formatCurrency(deficitAmount)} ر.س)`,
        amount: deficitAmount,
        category: 'أخرى',
        method: 'كاش',
        type: 'EXPENSE',
        date: targetDate
      };
      setExpenses((prev: ExpenseRecord[]) => [deficitRecord, ...prev]);
      showToast?.(`تم تسجيل تسوية عجز بمبلغ ${formatCurrency(deficitAmount)} ر.س ومطابقة الرصيد الفعلي! ⚖️`);
    } else {
      // Unrecorded surplus / top-up
      const surplusRecord: ExpenseRecord = {
        id: `topup-surplus-${Date.now()}`,
        desc: reconcileNote.trim() || `تسوية رصيد (فائض / تغذية مخصص +${formatCurrency(difference)} ر.س)`,
        amount: difference,
        category: 'تغذية مخصص',
        method: 'كاش',
        type: 'TOP_UP',
        date: targetDate
      };
      setExpenses((prev: ExpenseRecord[]) => [surplusRecord, ...prev]);
      showToast?.(`تم تسجيل تسوية فائض بمبلغ +${formatCurrency(difference)} ر.س ومطابقة الرصيد الفعلي! 💰`);
    }

    triggerCelebration();
    setIsReconcileOpen(false);
  };

  const handleSaveActualBalance = () => {
    const targetVal = parseFloat(tempActualBalanceInput);
    if (!isNaN(targetVal) && targetVal >= 0) {
      handleReconcileBalance(targetVal);
      setIsEditingActualBalance(false);
    }
  };

  // Sync actual balance with calculated theoretical balance
  const handleSyncWithCalculated = () => {
    setIsEditingActualBalance(false);
    triggerCelebration();
    showToast?.(`الرصيد الفعلي متزامن تلقائياً (${formatCurrency(actualCurrentBalance)} ر.س) مع سجل العمليات ⚡`);
  };

  const enteredActualNumber = parseFloat(actualBalanceInput);
  const liveDifference = !isNaN(enteredActualNumber) ? enteredActualNumber - actualCurrentBalance : 0;

  // Handle Quick Macro Submission
  const handleMacroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(macroAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Determine target date for the selected week
    const targetBucket = weeklyBuckets.find(b => b.id === selectedWeekId) || activeBucket;
    const dayToUse = targetBucket.isActive 
      ? currentDay 
      : Math.min(targetBucket.startDay + 1, targetBucket.endDay);
    
    const formattedDay = String(Math.min(dayToUse, totalDaysInMonth)).padStart(2, '0');
    const targetDate = `${selectedYearMonth}-${formattedDay}`;

    const description = macroDesc.trim() || `صرف ${macroCategory}`;
    onQuickAdd(description, amount, macroCategory, 'مدى / بطاقة بنكية', targetDate);
    triggerCelebration();

    setMacroAmount('');
    setMacroDesc('');
  };

  // Quick Preset Click
  const handlePresetClick = (amount: number, desc: string, cat: ExpenseCategory) => {
    const formattedDay = String(Math.min(currentDay, totalDaysInMonth)).padStart(2, '0');
    const targetDate = `${selectedYearMonth}-${formattedDay}`;

    onQuickAdd(desc, amount, cat, 'مدى / بطاقة بنكية', targetDate);
    triggerCelebration();
  };

  // Safe wrapper for deleting expense
  const handleDeleteExpenseWrapper = (id: string) => {
    onDeleteExpense(id);
  };

  const categoriesList: ExpenseCategory[] = [
    'طعام ومقاهي',
    'تسوق وشخصي',
    'بنزين وسيارة',
    'فواتير وخدمات',
    'سكن ومستلزمات',
    'صحة وعناية',
    'ترفيه وخروجات',
    'أخرى'
  ];

  // Base list depending on user's scope toggle (active month vs complete history)
  const historyBaseList = historyScope === 'month' ? activeMonthExpenses : expenses;

  // Filtered History
  const filteredHistory = historyBaseList.filter((e) => {
    const matchesCat = selectedCategoryFilter === 'all' || e.category === selectedCategoryFilter;
    const matchesSearch = e.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 font-['Readex_Pro',sans-serif] selection:bg-emerald-500 selection:text-black">
      
      {/* 1. Header & Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-[var(--ink)] text-base sm:text-lg">
              الباب الرابع: نظام مخصص المصروف الأسبوعي واليومي
            </h2>
            <span className="label-mono text-[10px] text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
              ALLOWANCE PLANNER
            </span>
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            توزيع السيولة الحرة شهرياً على 5 أسابيع محددة مع تحديد سقف الصرف الآمن يومياً
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnlySimulation ? (
            <div className="flex items-center gap-2">
              {onOpenStatementImportModal && (
                <button
                  type="button"
                  onClick={onOpenStatementImportModal}
                  className="btn btn-secondary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5 shadow-sm cursor-pointer border-blue-500/30 text-blue-300 hover:text-white hover:border-blue-500/50"
                  title="استيراد كشف حساب بنكي (.xlsx / .csv)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  <span>استيراد كشف بنكي</span>
                </button>
              )}
              <button
                type="button"
                onClick={onAddClick}
                className="btn btn-secondary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ صرف مفصل</span>
              </button>
            </div>
          ) : (
            <span className="text-xs text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl font-bold">
              وضع المحاكاة التقديرية (للقراءة فقط) 🔒
            </span>
          )}
        </div>
      </div>

      {/* 2. Hero Metric Banner (Integrated Smart Summary) */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0c162c] via-[#091122] to-[#070c18] shadow-2xl relative overflow-hidden space-y-6">
        
        {/* Background Subtle Glows */}
        <div className="absolute top-0 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-blue-500/10 rounded-full blur-[90px] pointer-events-none"></div>

        {/* Hero Top Grid: Safe Daily Limit (Primary), Active Week (Secondary), and Dedicated Permanent Actual Allowance Balance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch relative z-10">
          
          {/* Highlight 1: Today's Safe Spending Limit */}
          <div className="glass-panel p-5 rounded-2xl bg-[rgba(15,23,42,0.85)] border border-amber-500/30 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="label-mono text-amber-400 font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>حد الصرف الآمن لليوم</span>
              </span>
              <span className={`label-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                safeToSpendToday > 0 
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}>
                {safeToSpendToday > 0 ? 'ضمن السقف اليومي الآمن' : 'تجاوز السقف اليومي'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black font-mono text-amber-400 num-ltr tracking-tight">
                  {formatCurrency(safeToSpendToday)}
                </span>
                <span className="text-xs text-slate-400 font-sans">ر.س / اليوم</span>
              </div>
              <p className="text-[11px] text-slate-400">
                المعدل المستهدف الأساسي للشهر: <strong className="font-mono text-white num-ltr">{formatCurrency(activeBucket.dailyAllowance)}</strong> ر.س/يوم
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>الأيام المتبقية في الشهر:</span>
              <span className="font-mono font-bold text-white num-ltr">{remainingDaysInMonth} يوماً ({daysRemainingInActiveWeek} في الأسبوع)</span>
            </div>
          </div>

          {/* Highlight 2: Active Week Progress & Remaining */}
          <div className="glass-panel p-5 rounded-2xl bg-[rgba(15,23,42,0.85)] border border-blue-500/30 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="label-mono text-blue-400 font-bold text-xs flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span>{activeBucket.name} (النشط)</span>
              </span>
              <span className="label-mono text-[10px] text-blue-300 bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                {activeBucket.startDay} - {activeBucket.endDay} {currentMonthName}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-white num-ltr">
                    {formatCurrency(activeSummary.spent)}
                  </span>
                  <span className="text-xs text-slate-400">من حصة {formatCurrency(activeSummary.bucket.weeklyCap)} ر.س</span>
                </div>
                <span className={`label-mono text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                  activeSummary.percentage > 100 
                    ? 'text-rose-400 bg-rose-500/15' 
                    : activeSummary.percentage > 75 
                      ? 'text-amber-400 bg-amber-500/15' 
                      : 'text-emerald-400 bg-emerald-500/15'
                }`}>
                  {activeSummary.percentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    activeSummary.percentage > 100 
                      ? 'bg-rose-500' 
                      : activeSummary.percentage > 75 
                        ? 'bg-amber-400' 
                        : 'bg-blue-400'
                  }`}
                  style={{ width: `${Math.min(activeSummary.percentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>المتبقي المخصص لهذا الأسبوع:</span>
              <span className={`font-mono num-ltr font-extrabold ${currentWeekRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currentWeekRemaining >= 0 ? `+${formatCurrency(currentWeekRemaining)}` : formatCurrency(currentWeekRemaining)} ر.س
              </span>
            </div>
          </div>

          {/* Highlight 3: Dedicated Permanent "Actual Allowance Balance" (Single Source of Truth) */}
          <div className="glass-panel p-5 rounded-2xl bg-[rgba(15,23,42,0.85)] border border-emerald-500/35 flex flex-col justify-between space-y-3.5 shadow-lg relative">
            <div className="flex items-center justify-between">
              <span className="label-mono text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>الرصيد الفعلي المتوفر (المرجع الدائم)</span>
              </span>
              <div className="flex items-center gap-1.5">
                {!isReadOnlySimulation && (
                  <>
                    <button
                      type="button"
                      onClick={handleSyncWithCalculated}
                      className="text-[10px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                      title={`مزامنة فورية مع الرصيد المحسوب (${formatCurrency(calculatedTheoreticalBalance)} ر.س)`}
                    >
                      <RefreshCw className="w-2.5 h-2.5 text-slate-400" />
                      <span>مزامنة</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenReconcile}
                      className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                      title="تسوية الرصيد بالتفصيل ومطابقة الفوارق"
                    >
                      <Scale className="w-3 h-3 text-emerald-400" />
                      <span>تسوية</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Permanent Editable Field for Actual Allowance Balance */}
            <div className="space-y-1">
              {!isEditingActualBalance ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 num-ltr tracking-tight">
                      {formatCurrency(actualCurrentBalance)}
                    </span>
                    <span className="text-xs text-slate-400 font-sans">ر.س نقداً/محفظة</span>
                  </div>
                  {!isReadOnlySimulation && (
                    <button
                      onClick={() => {
                        setTempActualBalanceInput(String(actualCurrentBalance));
                        setIsEditingActualBalance(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition cursor-pointer"
                      title="تعديل الرصيد الفعلي يدوياً"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={tempActualBalanceInput}
                    onChange={(e) => setTempActualBalanceInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveActualBalance()}
                    className="flex-1 bg-black/90 border border-emerald-500 rounded-xl px-3 py-1.5 text-sm font-mono text-white outline-none"
                    autoFocus
                  />
                  <button onClick={handleSaveActualBalance} className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl cursor-pointer">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setIsEditingActualBalance(false)} className="p-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Discrepancy indicator vs calculated balance */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>المحسوب دفترياً: <strong className="text-slate-200 font-mono num-ltr">{formatCurrency(calculatedTheoreticalBalance)}</strong> ر.س</span>
                <span className={`font-mono font-bold num-ltr ${
                  Math.abs(actualCurrentBalance - calculatedTheoreticalBalance) < 0.01 
                    ? 'text-slate-400' 
                    : actualCurrentBalance > calculatedTheoreticalBalance 
                      ? 'text-emerald-400' 
                      : 'text-rose-400'
                }`}>
                  {actualCurrentBalance === calculatedTheoreticalBalance 
                    ? '✓ متطابق' 
                    : actualCurrentBalance > calculatedTheoreticalBalance 
                      ? `+${formatCurrency(actualCurrentBalance - calculatedTheoreticalBalance)} فائض` 
                      : `-${formatCurrency(calculatedTheoreticalBalance - actualCurrentBalance)} عجز`}
                </span>
              </div>
            </div>

            {/* Quick Top-Up Pills Row */}
            {!isReadOnlySimulation && (
              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[10px]">
                <span className="text-slate-400 whitespace-nowrap">تغذية سريعة:</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {[50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickTopUp(amt)}
                      className="bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-mono font-bold transition cursor-pointer"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Hero Bottom Compact Stats Row: The 4 Core Specified Metrics */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs relative z-10">
          
          {/* Metric 1: [TOTAL_MONTHLY_BUDGET] */}
          <div className="bg-[#090e1a]/80 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">1. المخصص الشهري المستهدف:</span>
              {!isEditingBudget ? (
                <span className="text-base font-bold font-mono text-white num-ltr">
                  {formatCurrency(monthlyBudget)} <small className="text-[10px] text-slate-400">ر.س</small>
                </span>
              ) : (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={tempBudgetInput}
                    onChange={(e) => setTempBudgetInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()}
                    className="w-20 bg-black/80 border border-emerald-500 rounded-lg px-2 py-0.5 text-xs font-mono text-white outline-none"
                    autoFocus
                  />
                  <button onClick={handleSaveBudget} className="p-1 text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setIsEditingBudget(false)} className="p-1 text-slate-400"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
            {!isEditingBudget && !isReadOnlySimulation && (
              <button 
                onClick={() => {
                  setTempBudgetInput(String(monthlyBudget));
                  setIsEditingBudget(true);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition cursor-pointer"
                title="تعديل مخصص الشهر"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Metric 2: [TOTAL_TOP_UPS] */}
          <div className="bg-[#090e1a]/80 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">2. إجمالي التغذيات الإضافية:</span>
              <span className="text-base font-bold font-mono text-emerald-400 num-ltr">
                +{formatCurrency(totalTopUps)} <small className="text-[10px] text-slate-400">ر.س</small>
              </span>
            </div>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Metric 3: [ACCUMULATED_EXPENSES] (Pure positive genuine expenses) */}
          <div className="bg-[#090e1a]/80 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">3. المنصرف الفعلي التراكمي:</span>
              <span className="text-base font-bold font-mono text-rose-400 num-ltr">
                -{formatCurrency(accumulatedExpenses)} <small className="text-[10px] text-slate-400">ر.س</small>
              </span>
            </div>
            <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>

          {/* Metric 4: [ACTUAL_CURRENT_BALANCE] */}
          <div className="bg-[#090e1a]/80 p-3 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">4. الرصيد الفعلي المتوفر:</span>
              <span className="text-base font-bold font-mono text-emerald-400 num-ltr">
                {formatCurrency(actualCurrentBalance)} <small className="text-[10px] text-slate-400">ر.س</small>
              </span>
            </div>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

        </div>

      </div>

      {/* 3. Streamlined Quick Logging (Macro Logging) */}
      {!isReadOnlySimulation ? (
        <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 bg-[#0a1122]/90 space-y-4">
          
          {/* Quick Log Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">التسجيل السريع للمصروف اليومي</h3>
                <p className="text-[11px] text-slate-400">سجل عملياتك بنقرة واحدة باستخدام الخيارات الجاهزة أو النموذج السريع</p>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              الشهر: <strong className="text-white font-bold">{currentMonthName} {currentYear}</strong>
            </span>
          </div>

          {/* Preset Quick Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scroll">
            <span className="text-xs font-bold text-slate-400 shrink-0">جاهز بنقرة:</span>
            
            <button
              type="button"
              onClick={() => handlePresetClick(18, 'قهوة ومشروبات', 'طعام ومقاهي')}
              className="bg-[#0f172a] hover:bg-amber-500/15 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span>☕ قهوة (18 ر.س)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePresetClick(35, 'وجبة غداء', 'طعام ومقاهي')}
              className="bg-[#0f172a] hover:bg-emerald-500/15 border border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5 text-emerald-400" />
              <span>🍔 غداء (35 ر.س)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePresetClick(100, 'تعبئة بنزين', 'بنزين وسيارة')}
              className="bg-[#0f172a] hover:bg-blue-500/15 border border-slate-800 hover:border-blue-500/40 text-slate-200 hover:text-blue-300 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Fuel className="w-3.5 h-3.5 text-blue-400" />
              <span>⛽ بنزين (100 ر.س)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePresetClick(150, 'سوبرماركت ومقاضي', 'سكن ومستلزمات')}
              className="bg-[#0f172a] hover:bg-purple-500/15 border border-slate-800 hover:border-purple-500/40 text-slate-200 hover:text-purple-300 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-purple-400" />
              <span>🛒 مقاضي (150 ر.س)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePresetClick(50, 'صيدلية وعناية', 'صحة وعناية')}
              className="bg-[#0f172a] hover:bg-rose-500/15 border border-slate-800 hover:border-rose-500/40 text-slate-200 hover:text-rose-300 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Pill className="w-3.5 h-3.5 text-rose-400" />
              <span>💊 صيدلية (50 ر.س)</span>
            </button>
          </div>

          {/* Custom Input Form */}
          <form onSubmit={handleMacroSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center pt-1">
            
            <div className="sm:col-span-3">
              <input
                type="number"
                step="any"
                placeholder="المبلغ (مثلاً 50)..."
                value={macroAmount}
                onChange={(e) => setMacroAmount(e.target.value)}
                required
                className="w-full bg-[#070c18] border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white num-ltr placeholder-slate-500 outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <input
                type="text"
                placeholder="وصف المصروف (اختياري)..."
                value={macroDesc}
                onChange={(e) => setMacroDesc(e.target.value)}
                className="w-full bg-[#070c18] border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={macroCategory}
                onChange={(e) => setMacroCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-[#070c18] border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-xl transition shadow-lg active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>تسجيل سريع</span>
              </button>
            </div>

          </form>
        </div>
      ) : (
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>وضع المحاكاة المستقبلية (قراءة فقط):</strong> تسجيل المصاريف اليومية وتعديل السقف معطل في أشهر المحاكاة لمنع corrupting البيانات الحقيقية.
            </span>
          </div>
        </div>
      )}

      {/* 4. Weekly Breakdown Optimization (Tabs & Expandable Active Week) */}
      <div className="space-y-4">
        
        {/* Section Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-white">توزيع الميزانية على أسابيع الشهر</h3>
            <span className="text-[11px] text-slate-400">(اختر أسبوعاً لمعاينة التفاصيل)</span>
          </div>
        </div>

        {/* 5-Week Compact Timeline Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {weeklyBuckets.map((b) => {
            const summary = bucketSummaries.find(s => s.bucket.id === b.id) || {
              bucket: { ...b, effectiveCap: b.weeklyCap },
              spent: 0,
              topUps: 0,
              remaining: b.weeklyCap,
              allocatedAmount: b.weeklyCap,
              percentage: 0,
              itemsCount: 0,
              expenses: []
            };

            const isSelected = selectedWeekId === b.id;

            return (
              <button
                key={b.id}
                onClick={() => setSelectedWeekId(b.id)}
                className={`p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                  isSelected 
                    ? 'bg-[#0f1d36] border-blue-500/80 shadow-lg ring-1 ring-blue-500/50' 
                    : b.isActive
                      ? 'bg-[#0b1629] border-emerald-500/40 hover:border-emerald-500/70'
                      : 'bg-[#080d1a] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-200">{b.name}</span>
                  <span className={`label-mono text-[9px] px-2 py-0.5 rounded-full font-bold ${
                    b.isActive
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : b.isPast
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {b.isActive ? 'نشط' : b.isPast ? 'مكتمل' : 'قادم'}
                  </span>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400">الأيام {b.startDay} - {b.endDay}</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xs font-mono font-bold text-white num-ltr">
                      {formatCurrency(summary.spent)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      / {formatCurrency(summary.bucket.effectiveCap || b.weeklyCap)}
                    </span>
                  </div>
                </div>

                {/* Remaining budget indicator */}
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60">
                  <span className="text-slate-400">المتبقي:</span>
                  <span className={`font-mono font-bold num-ltr ${summary.remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {summary.remaining >= 0 ? `+${formatCurrency(summary.remaining)}` : formatCurrency(summary.remaining)} ر.س
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/60">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      summary.percentage > 100 
                        ? 'bg-rose-500' 
                        : summary.percentage > 75 
                          ? 'bg-amber-400' 
                          : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(summary.percentage, 100)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Week Detailed Breakdown Card */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-[#0b1325] space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
              <h4 className="font-extrabold text-sm text-white">
                تفاصيل {selectedSummary.bucket.name} (الأيام {selectedSummary.bucket.startDay} إلى {selectedSummary.bucket.endDay})
              </h4>
              {selectedSummary.bucket.isActive && (
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md font-bold border border-blue-500/30">
                  الأسبوع الحالي
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-400">المخطط: </span>
                <strong className="text-white num-ltr">{formatCurrency(selectedSummary.bucket.effectiveCap || selectedSummary.bucket.weeklyCap)} ر.س</strong>
              </div>
              <div>
                <span className="text-slate-400">المصروف: </span>
                <strong className="text-rose-400 num-ltr">{formatCurrency(selectedSummary.spent)} ر.س</strong>
              </div>
              <div>
                <span className="text-slate-400">المتبقي: </span>
                <strong className={`num-ltr ${selectedSummary.remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(selectedSummary.remaining)} ر.س
                </strong>
              </div>
            </div>
          </div>

          {/* List of expenses for selected week */}
          {selectedSummary.expenses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {selectedSummary.expenses.map((exp) => (
                <div 
                  key={exp.id}
                  className="p-3 rounded-2xl bg-[#070c18] border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-white block">{exp.desc}</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{exp.category}</span>
                      <span className="font-mono text-slate-500">{exp.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-xs num-ltr ${exp.type === 'TOP_UP' || exp.category === 'تغذية مخصص' || exp.amount < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {exp.type === 'TOP_UP' || exp.category === 'تغذية مخصص' || exp.amount < 0 ? `+${formatCurrency(Math.abs(exp.amount))}` : `-${formatCurrency(exp.amount)}`} <small className="text-[9px] text-slate-500">ر.س</small>
                    </span>
                    {!isReadOnlySimulation && (
                      <button
                        onClick={() => handleDeleteExpenseWrapper(exp.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition cursor-pointer"
                        title="حذف العملية"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
              لا توجد عمليات مصاريف مسجلة لهذا الأسبوع حتى الآن.
            </div>
          )}

        </div>

      </div>

      {/* 5. Full History Table (Collapsible) */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 bg-[#080e1c] space-y-3">
        
        <div 
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            <h3 className="font-extrabold text-sm text-white">
              سجل العمليات {historyScope === 'month' ? `(${currentMonthName} - ${activeMonthExpenses.length})` : `(كافة الأشهر - ${expenses.length})`}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{isHistoryExpanded ? 'إخفاء' : 'عرض السجل'}</span>
            <button className="p-1 rounded-lg bg-white/5 text-slate-400">
              {isHistoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isHistoryExpanded && (
          <div className="space-y-3 pt-3 border-t border-slate-800/80 animate-fadeIn">
            
            {/* Search, Scope and Category Filters */}
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute top-1/2 -translate-y-1/2 right-3" />
                  <input
                    type="text"
                    placeholder="بحث في المصروفات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#070c18] border border-slate-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 bg-[#070c18] border border-slate-800 p-0.5 rounded-xl text-[11px] shrink-0">
                  <button
                    type="button"
                    onClick={() => setHistoryScope('month')}
                    className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                      historyScope === 'month'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    الشهر المحدد
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryScope('all')}
                    className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                      historyScope === 'all'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    الكل
                  </button>
                </div>
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full sm:w-auto bg-[#070c18] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
              >
                <option value="all">كافة التصنيفات</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto custom-scroll">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold bg-[#050914]/50">
                    <th className="py-2.5 px-3">الوصف</th>
                    <th className="py-2.5 px-3">الفئة</th>
                    <th className="py-2.5 px-3">طريقة الدفع</th>
                    <th className="py-2.5 px-3">التاريخ</th>
                    <th className="py-2.5 px-3 text-left">المبلغ</th>
                    <th className="py-2.5 px-2 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredHistory.map((e) => {
                    const isTopUpRecord = e.type === 'TOP_UP' || e.category === 'تغذية مخصص' || e.amount < 0;
                    return (
                      <tr key={e.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-2.5 px-3 font-bold text-white">{e.desc}</td>
                        <td className="py-2.5 px-3 text-slate-300">
                          <span className={`px-2 py-0.5 rounded text-[11px] border ${
                            isTopUpRecord 
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                              : 'bg-white/5 text-slate-300 border-white/5'
                          }`}>
                            {e.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{e.method}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{e.date}</td>
                        <td className={`py-2.5 px-3 text-left font-mono font-bold num-ltr ${isTopUpRecord ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isTopUpRecord ? `+${formatCurrency(Math.abs(e.amount))}` : `-${formatCurrency(e.amount)}`} <small className="text-[10px] text-slate-500">ر.س</small>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {!isReadOnlySimulation && (
                            <button
                              onClick={() => handleDeleteExpenseWrapper(e.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded transition cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                        لا توجد نتائج مطابقة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* 6. Balance Reconciliation & Top-Up Modal */}
      {isReconcileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1325] border border-slate-700/80 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl relative text-right space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    تحديث الرصيد الفعلي / تسوية المخصص
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    مطابقة الرصيد الحقيقي المتوفر في المحفظة/البنك مع الحسابات
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReconcileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current vs Actual Comparison Cards */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-[#070c18] border border-slate-800 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-400 block mb-1">الرصيد المحسوب دفترياً:</span>
                <span className="font-mono font-bold text-sm sm:text-base num-ltr text-slate-200">
                  {formatCurrency(calculatedTheoreticalBalance)} <small className="text-[10px] text-slate-500">ر.س</small>
                </span>
              </div>

              <div className="bg-[#070c18] border border-emerald-500/30 p-3 rounded-2xl">
                <span className="text-[10px] text-emerald-400 block mb-1">الرصيد الفعلي المدخل:</span>
                <span className="font-mono font-bold text-sm sm:text-base text-emerald-300 num-ltr">
                  {!isNaN(enteredActualNumber) ? formatCurrency(enteredActualNumber) : '0'} <small className="text-[10px] text-slate-500">ر.س</small>
                </span>
              </div>
            </div>

            {/* Actual Balance Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                أدخل الرصيد المتوفر فعلياً معك الآن (ر.س):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  autoFocus
                  value={actualBalanceInput}
                  onChange={(e) => setActualBalanceInput(e.target.value)}
                  placeholder="مثلاً 350..."
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono num-ltr placeholder-slate-500 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleReconcileBalance(parseFloat(actualBalanceInput));
                    }
                  }}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">ر.س</span>
              </div>
            </div>

            {/* Live Delta Indicator */}
            <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
              liveDifference > 0 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : liveDifference < 0 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                  : 'bg-slate-800/40 border-slate-700 text-slate-300'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className="font-bold">الفارق (DELTA):</span>
                <span className="font-mono font-black num-ltr text-sm">
                  {liveDifference > 0 ? `+${formatCurrency(liveDifference)}` : liveDifference < 0 ? `-${formatCurrency(Math.abs(liveDifference))}` : '0'} ر.س
                </span>
              </div>
              <span className="text-[10px] font-bold">
                {liveDifference > 0 
                  ? '💰 فائض / إيداع وتغذية للمخصص' 
                  : liveDifference < 0 
                    ? '📉 عجز / مصروفات غير مسجلة' 
                    : '✓ متطابق تماماً'}
              </span>
            </div>

            {/* Optional Note */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 block">
                ملاحظة التسوية (اختياري):
              </label>
              <input
                type="text"
                value={reconcileNote}
                onChange={(e) => setReconcileNote(e.target.value)}
                placeholder={liveDifference > 0 ? 'مثلاً: تغذية كاش إضافية للمصروف' : 'مثلاً: مصروفات نقدية سريعة غير مسجلة'}
                className="w-full bg-[#070c18] border border-slate-800 focus:border-slate-600 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleReconcileBalance(parseFloat(actualBalanceInput))}
                disabled={isNaN(enteredActualNumber) || enteredActualNumber < 0}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد التسوية وتحديث الحسابات</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReconcileOpen(false)}
                className="btn btn-ghost text-xs py-2.5 px-4 text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
