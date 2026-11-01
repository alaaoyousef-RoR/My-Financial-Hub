import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { useAuth } from './AuthContext';
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
  AccountBalancesState,
  FinancialTransaction,
  ExpenseCategory,
  PaymentMethod,
  FrequencyType
} from '../types/finance';
import { 
  INITIAL_INCOMES, 
  INITIAL_CAR_PLAN, 
  INITIAL_FIXED_OBLIGATIONS, 
  INITIAL_INSTALLMENTS, 
  INITIAL_EXPENSES, 
  INITIAL_SAVINGS, 
  INITIAL_LIABILITIES, 
  INITIAL_RECEIVABLES, 
  INITIAL_MONTHLY_DATA,
  INITIAL_ACCOUNT_BALANCES
} from '../data/initialData';
import { formatCurrency, triggerCelebration } from '../utils/formatters';

/**
 * Recursively sanitizes state objects before persisting to Cloud Firestore
 * by converting any `undefined` values to `null` to comply with Firestore constraints.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === undefined) return null as unknown as T;
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj.toISOString() as unknown as T;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = value === undefined ? null : sanitizeForFirestore(value);
  }
  return result as T;
}
import {
  calculateTotalFixed,
  calculateActiveBNPL,
  calculateUnpaidMonthCommitments,
  calculateLiquidity,
  calculateNetRealLiquidity,
  calculateTotalLiquidNetWorth,
  calculateMonthlyNet,
  calculateMonthlyFreeCash,
  calculateProjectedMonth
} from '../utils/financialMath';
import {
  getCurrentYearMonth,
  isDateInMonth,
  generateTimelineMonths
} from '../utils/dateFilters';

interface FinancialContextType {
  // Sync state
  dataLoading: boolean;
  saveStatus: 'saved' | 'saving' | 'error';

  // State Entities
  incomes: IncomeItem[];
  carPlan: CarPlan;
  fixedObligations: FixedObligation[];
  installments: InstallmentRecord[];
  expenses: ExpenseRecord[];
  savings: SavingsItem[];
  liabilities: LiabilityItem[];
  receivables: ReceivableRecord[];
  monthlyData: MonthlyRecord[];
  accountBalances: AccountBalancesState;
  transactions: FinancialTransaction[];
  toastMessage: string | null;

  // Derived Financial Metrics
  totalIncome: number;
  totalFixed: number;
  totalBNPL: number;
  totalPersonalExpenses: number;
  totalSavings: number;
  discretionaryNet: number;
  netSavingsMonthly: number;
  unpaidCommitments: number;
  totalNetLiquidity: number;
  realAvailableLiquidity: number;

  // Direct State Setters
  setIncomes: React.Dispatch<React.SetStateAction<IncomeItem[]>>;
  setFixedObligations: React.Dispatch<React.SetStateAction<FixedObligation[]>>;
  setCarPlan: React.Dispatch<React.SetStateAction<CarPlan>>;
  setInstallments: React.Dispatch<React.SetStateAction<InstallmentRecord[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseRecord[]>>;
  setSavings: React.Dispatch<React.SetStateAction<SavingsItem[]>>;
  setLiabilities: React.Dispatch<React.SetStateAction<LiabilityItem[]>>;
  setReceivables: React.Dispatch<React.SetStateAction<ReceivableRecord[]>>;
  setMonthlyData: React.Dispatch<React.SetStateAction<MonthlyRecord[]>>;
  setAccountBalances: React.Dispatch<React.SetStateAction<AccountBalancesState>>;
  setTransactions: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;

  // Unified Transactional Dispatch Actions
  payInstallment: (id: string) => boolean;
  undoPayInstallment: (id: string) => void;
  toggleInstallmentStatus: (id: string) => void;
  deleteInstallment: (id: string) => void;
  saveInstallment: (name: string, platform: any, amount: number, start: string, end: string, remainingMonths: number, category?: string) => void;
  updateInstallment: (updatedItem: InstallmentRecord) => void;

  transferToSavings: (title: string, amount: number, category: any, notes?: string) => boolean;
  deleteSavings: (id: string) => void;

  logExpense: (desc: string, amount: number, category: ExpenseCategory, method: PaymentMethod, date?: string) => boolean;
  deleteExpense: (id: string) => void;

  addIncome: (title: string, amount: number, frequency: FrequencyType, category: any, isRecurring: boolean, notes?: string) => void;
  deleteIncome: (id: string) => void;

  payCarInstallment: () => void;
  updateCarPlan: (plan: CarPlan) => void;

  updateAccountBalances: (checking: number, savings: number) => void;
  collectReceivable: (id: string, destination: 'income' | 'bnpl_payoff' | 'savings') => void;
  deleteReceivable: (id: string) => void;
  saveReceivable: (name: string, amount: number, notes?: string) => void;

  saveLiability: (title: string, amount: number, dueDate: string, category: any, notes?: string) => void;
  deleteLiability: (id: string) => void;

  saveFixedObligation: (title: string, amount: number, category: any, dueDay?: number, notes?: string) => void;
  deleteFixedObligation: (id: string) => void;

  updateMonth: (updated: MonthlyRecord) => void;
  addMonth: (item: MonthlyRecord) => void;
  deleteMonth: (id: string) => void;

  exportBackupJSON: () => void;
  importBackupJSON: (file: File) => void;
  resetAllData: () => void;
  resetToZeroTestMode: () => void;
  showToast: (msg: string) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Helper to read initial state lazily from localStorage or fallback
  function getStoredState<T>(key: string, fallback: T): T {
    try {
      const s = localStorage.getItem(key);
      if (s !== null) {
        const parsed = JSON.parse(s);
        console.log(`[Persistence] Initialized ${key} from localStorage:`, parsed);
        return parsed;
      }
    } catch (e) {
      console.error(`[Persistence] Error reading ${key} from localStorage`, e);
    }
    return fallback;
  }

  // Core Financial Entities initialized lazily from localStorage
  const [incomes, setIncomes] = useState<IncomeItem[]>(() => getStoredState('hub_incomes', INITIAL_INCOMES));
  const [carPlan, setCarPlan] = useState<CarPlan>(() => getStoredState('hub_car_plan', INITIAL_CAR_PLAN));
  const [fixedObligations, setFixedObligations] = useState<FixedObligation[]>(() => getStoredState('hub_fixed_obligations', INITIAL_FIXED_OBLIGATIONS));
  const [installments, setInstallments] = useState<InstallmentRecord[]>(() => getStoredState('hub_installments', INITIAL_INSTALLMENTS));
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => getStoredState('hub_expenses', INITIAL_EXPENSES));
  const [savings, setSavings] = useState<SavingsItem[]>(() => getStoredState('hub_savings', INITIAL_SAVINGS));
  const [liabilities, setLiabilities] = useState<LiabilityItem[]>(() => getStoredState('hub_liabilities', INITIAL_LIABILITIES));
  const [receivables, setReceivables] = useState<ReceivableRecord[]>(() => getStoredState('hub_receivables', INITIAL_RECEIVABLES));
  const [monthlyData, setMonthlyData] = useState<MonthlyRecord[]>(() => getStoredState('hub_monthly', INITIAL_MONTHLY_DATA));
  const [accountBalances, setAccountBalances] = useState<AccountBalancesState>(() => getStoredState('liquid_account_balances', INITIAL_ACCOUNT_BALANCES));
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => getStoredState('hub_transactions_log', []));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isRemoteSyncRef = useRef(false);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Persistent Auto-Sync to localStorage on every state mutation
  useEffect(() => {
    try {
      localStorage.setItem('hub_incomes', JSON.stringify(incomes));
      localStorage.setItem('hub_car_plan', JSON.stringify(carPlan));
      localStorage.setItem('hub_fixed_obligations', JSON.stringify(fixedObligations));
      localStorage.setItem('hub_installments', JSON.stringify(installments));
      localStorage.setItem('hub_expenses', JSON.stringify(expenses));
      localStorage.setItem('hub_savings', JSON.stringify(savings));
      localStorage.setItem('hub_liabilities', JSON.stringify(liabilities));
      localStorage.setItem('hub_receivables', JSON.stringify(receivables));
      localStorage.setItem('hub_monthly', JSON.stringify(monthlyData));
      localStorage.setItem('liquid_account_balances', JSON.stringify(accountBalances));
      localStorage.setItem('hub_transactions_log', JSON.stringify(transactions));
      console.log('[Persistence] All financial states committed to localStorage ✓');
    } catch (e) {
      console.error('[Persistence] Error writing state to localStorage:', e);
    }
  }, [incomes, carPlan, fixedObligations, installments, expenses, savings, liabilities, receivables, monthlyData, accountBalances, transactions]);

  // Real-time synchronization with Firestore
  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    const docPath = `users/${user.uid}/data/financial_dashboard`;
    const docRef = doc(db, 'users', user.uid, 'data', 'financial_dashboard');

    const unsubscribe = onSnapshot(
      docRef,
      async (snapshot) => {
        // Ignore local write echoes to prevent race-condition loops
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }

        // Lock outbound sync while applying incoming remote snapshot
        isRemoteSyncRef.current = true;
        try {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (Array.isArray(data.incomes)) setIncomes(data.incomes);
            if (data.carPlan) setCarPlan(data.carPlan);
            if (Array.isArray(data.fixedObligations)) setFixedObligations(data.fixedObligations);
            if (Array.isArray(data.installments)) setInstallments(data.installments);
            if (Array.isArray(data.expenses)) setExpenses(data.expenses);
            if (Array.isArray(data.savings)) setSavings(data.savings);
            if (Array.isArray(data.liabilities)) setLiabilities(data.liabilities);
            if (Array.isArray(data.receivables)) setReceivables(data.receivables);
            if (Array.isArray(data.monthlyData)) setMonthlyData(data.monthlyData);
            if (data.accountBalances) setAccountBalances(data.accountBalances);
            if (Array.isArray(data.transactions)) setTransactions(data.transactions);
            setSaveStatus('saved');
            console.log('[Persistence] Synced remote document from Cloud Firestore ✓');
          } else {
            // First time provisioning for new user: initialize remote document with zeroed metrics
            const currentLocalDoc = {
              userId: user.uid,
              openingBalance: accountBalances.checkingBalance || 0,
              currentBalance: accountBalances.checkingBalance || 0,
              totalIncome: 0,
              totalExpenses: 0,
              isSetupComplete: false,
              incomes,
              carPlan,
              fixedObligations,
              installments,
              expenses,
              savings,
              liabilities,
              receivables,
              monthlyData,
              accountBalances,
              transactions,
              updatedAt: new Date().toISOString()
            };
            await setDoc(docRef, sanitizeForFirestore(currentLocalDoc));
            setSaveStatus('saved');
            console.log('[Persistence] Initialized new remote Firestore document with baseline metrics');
          }
        } catch (err) {
          setSaveStatus('error');
          handleFirestoreError(err, OperationType.WRITE, docPath);
        } finally {
          setDataLoading(false);
          // Safely release mutex lock after React state updates settle
          setTimeout(() => {
            isRemoteSyncRef.current = false;
          }, 350);
        }
      },
      (err) => {
        // Rollback save status to error without wiping local storage
        setSaveStatus('error');
        showToast('⚠️ تعذر مزامنة البيانات مع السحابة. بياناتك محفوظة محلياً.');
        console.error('[Persistence] Firestore read error, local storage preserved:', err);
        handleFirestoreError(err, OperationType.GET, docPath);
        setDataLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Persist mutations to Firestore
  const syncToFirestore = async (customOverrides?: Partial<any>) => {
    if (!user || isRemoteSyncRef.current) return;
    const docPath = `users/${user.uid}/data/financial_dashboard`;
    try {
      setSaveStatus('saving');
      const payload = {
        userId: user.uid,
        incomes,
        carPlan,
        fixedObligations,
        installments,
        expenses,
        savings,
        liabilities,
        receivables,
        monthlyData,
        accountBalances,
        transactions,
        updatedAt: new Date().toISOString(),
        ...customOverrides
      };
      await setDoc(doc(db, 'users', user.uid, 'data', 'financial_dashboard'), sanitizeForFirestore(payload), { merge: true });
      setSaveStatus('saved');
      console.log('[Persistence] Debounced sync committed to Cloud Firestore ✓');
    } catch (err) {
      // Rollback UI save status to error without wiping local storage
      setSaveStatus('error');
      showToast('⚠️ فشل حفظ التعديلات في السحابة. بياناتك محفوظة في المتصفح مؤقتاً.');
      console.error('[Persistence] Firestore write error, local storage preserved:', err);
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  };

  // Sync state updates when user mutates data (debounced 800ms to protect Firestore quota limits)
  useEffect(() => {
    if (!dataLoading && user && !isRemoteSyncRef.current) {
      setSaveStatus('saving');
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        syncToFirestore();
      }, 800);
    }
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [incomes, carPlan, fixedObligations, installments, expenses, savings, liabilities, receivables, monthlyData, accountBalances, transactions, user, dataLoading]);

  // Derived Financial Equations
  const totalIncome = useMemo(() => {
    return incomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [incomes]);

  const totalFixed = useMemo(() => {
    return calculateTotalFixed(fixedObligations, carPlan);
  }, [fixedObligations, carPlan]);

  const totalBNPL = useMemo(() => {
    return calculateActiveBNPL(installments, 0).totalBNPL;
  }, [installments]);

  const totalPersonalExpenses = useMemo(() => {
    const currentYM = getCurrentYearMonth();
    return expenses
      .filter((e) => isDateInMonth(e.date, currentYM) && e.amount > 0 && e.category !== 'تغذية مخصص' && e.type !== 'TOP_UP')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const totalSavings = useMemo(() => {
    return savings.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  }, [savings]);

  const unpaidCommitments = useMemo(() => {
    return calculateUnpaidMonthCommitments(fixedObligations, carPlan, installments);
  }, [fixedObligations, carPlan, installments]);

  const discretionaryNet = useMemo(() => {
    return calculateMonthlyNet(totalIncome, totalFixed, totalBNPL, 0);
  }, [totalIncome, totalFixed, totalBNPL]);

  const netSavingsMonthly = useMemo(() => {
    return Math.max(Math.round((discretionaryNet - totalPersonalExpenses) * 100) / 100, 0);
  }, [discretionaryNet, totalPersonalExpenses]);

  const totalNetLiquidity = useMemo(() => {
    return calculateTotalLiquidNetWorth(accountBalances.checkingBalance, accountBalances.savingsBalance);
  }, [accountBalances.checkingBalance, accountBalances.savingsBalance]);

  // Dynamic monthly timeline records derived deterministically using calculateProjectedMonth and rolling timeline
  const computedMonthlyData = useMemo(() => {
    const timeline = generateTimelineMonths(0, 14);
    return timeline.map((m, idx) => {
      const proj = calculateProjectedMonth({
        incomes,
        fixedObligations,
        carPlan,
        installments,
        accountBalances
      }, idx);

      const homeObligation = fixedObligations.find(f => f.category === 'سكن وإيجار')?.amount || 0;
      const gasObligation = fixedObligations.find(f => f.category === 'بنزين وتشغيل')?.amount || 0;

      return {
        id: m.id,
        month: m.name,
        salary: proj.projectedIncome,
        car: proj.projectedCar,
        home: homeObligation,
        gas: gasObligation,
        tamara: proj.projectedTamara,
        tabby: proj.projectedTabby,
        note: m.milestoneTag || ''
      };
    });
  }, [incomes, fixedObligations, carPlan, installments, accountBalances]);

  const realAvailableLiquidity = useMemo(() => {
    return calculateLiquidity(accountBalances.checkingBalance, unpaidCommitments);
  }, [accountBalances.checkingBalance, unpaidCommitments]);

  // Actions
  const payInstallment = (id: string): boolean => {
    const target = installments.find(i => i.id === id);
    if (!target) return false;

    if (accountBalances.checkingBalance < target.amount) {
      showToast(`⚠️ تنبيه: رصيدك الجاري (${formatCurrency(accountBalances.checkingBalance)} ر.س) أقل من قيمة القسط (${formatCurrency(target.amount)} ر.س)`);
    }

    const newChecking = Math.max(Math.round((accountBalances.checkingBalance - target.amount) * 100) / 100, 0);
    const total = target.totalMonths || Math.max(target.remainingMonths + (target.paidMonths || 0), 4);
    const currentPaid = target.paidMonths ?? Math.max(total - target.remainingMonths, 0);
    const newRemaining = Math.max(target.remainingMonths - 1, 0);
    const newPaid = currentPaid + 1;
    const isCompleted = newRemaining === 0;

    setAccountBalances(prev => ({
      ...prev,
      checkingBalance: newChecking,
      lastUpdated: new Date().toISOString()
    }));

    setInstallments(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          totalMonths: total,
          paidMonths: newPaid,
          remainingMonths: newRemaining,
          isPaidThisMonth: true,
          status: isCompleted ? 'completed' : 'active',
          remainingNote: isCompleted ? 'مكتمل بالكامل 🎉' : `${newRemaining} أشهر متبقية`
        };
      }
      return item;
    }));

    const newTx: FinancialTransaction = {
      id: `tx-bnpl-${Date.now()}`,
      type: 'bnpl_installment',
      title: `سداد قسط ${target.name} (${target.platform})`,
      amount: target.amount,
      date: new Date().toISOString().split('T')[0],
      sourceAccount: 'checking',
      destinationAccount: 'external',
      relatedId: target.id,
      notes: isCompleted ? 'اكتملت خطة الأقساط بالكامل' : `متبقي ${newRemaining} أشهر`
    };
    setTransactions(prev => [newTx, ...prev]);

    triggerCelebration();
    showToast(`تم سداد قسط ${target.name} (${formatCurrency(target.amount)} ر.س) وخُصم من الحساب الجاري بنجاح! 🎉`);
    return true;
  };

  const undoPayInstallment = (id: string) => {
    const target = installments.find(i => i.id === id);
    if (!target) return;

    const restoredChecking = Math.round((accountBalances.checkingBalance + target.amount) * 100) / 100;
    const total = target.totalMonths || 4;
    const currentPaid = Math.max((target.paidMonths ?? (total - target.remainingMonths)) - 1, 0);
    const newRemaining = target.remainingMonths + 1;

    setAccountBalances(prev => ({
      ...prev,
      checkingBalance: restoredChecking,
      lastUpdated: new Date().toISOString()
    }));

    setInstallments(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          totalMonths: total,
          paidMonths: currentPaid,
          remainingMonths: newRemaining,
          isPaidThisMonth: false,
          status: 'active',
          remainingNote: `${newRemaining} أشهر متبقية`
        };
      }
      return item;
    }));

    setTransactions(prev => prev.filter(t => !(t.relatedId === id && t.type === 'bnpl_installment')));
    showToast(`تم التراجع عن سداد القسط واستعادة ${formatCurrency(target.amount)} ر.س للحساب الجاري`);
  };

  const toggleInstallmentStatus = (id: string) => {
    setInstallments(prev => prev.map(i => {
      if (i.id === id) {
        const nextStatus = i.status === 'active' ? 'completed' : 'active';
        return { 
          ...i, 
          status: nextStatus,
          remainingNote: nextStatus === 'completed' ? 'مكتمل بالكامل 🎉' : `${i.remainingMonths} أشهر متبقية`
        };
      }
      return i;
    }));
    showToast('تم تحديث حالة القسط');
  };

  const deleteInstallment = (id: string) => {
    setInstallments(prev => prev.filter(i => i.id !== id));
    showToast('تم حذف القسط');
  };

  const saveInstallment = (
    name: string,
    platform: any,
    amount: number,
    start: string,
    end: string,
    remainingMonths: number,
    category?: string
  ) => {
    const newItem: InstallmentRecord = {
      id: `inst-${Date.now()}`,
      name,
      platform,
      amount,
      start,
      end,
      remainingMonths,
      totalMonths: remainingMonths,
      paidMonths: 0,
      remainingNote: `${remainingMonths} أشهر متبقية`,
      status: 'active',
      category
    };
    setInstallments(prev => [newItem, ...prev]);
    showToast(`تم إضافة قسط ${name} بنجاح`);
  };

  const updateInstallment = (updatedItem: InstallmentRecord) => {
    setInstallments(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    showToast(`تم تحديث قسط ${updatedItem.name} بنجاح ✨`);
  };

  const transferToSavings = (title: string, amount: number, category: any, notes?: string): boolean => {
    if (amount <= 0) return false;

    if (accountBalances.checkingBalance < amount) {
      showToast(`⚠️ تنبيه: رصيدك الجاري (${formatCurrency(accountBalances.checkingBalance)} ر.س) أقل من مبلغ التحويل (${formatCurrency(amount)} ر.س)`);
    }

    const newChecking = Math.max(Math.round((accountBalances.checkingBalance - amount) * 100) / 100, 0);
    const newSavings = Math.max(Math.round((accountBalances.savingsBalance + amount) * 100) / 100, 0);

    setAccountBalances(prev => ({
      ...prev,
      checkingBalance: newChecking,
      savingsBalance: newSavings,
      lastUpdated: new Date().toISOString()
    }));

    const newItem: SavingsItem = {
      id: `sav-${Date.now()}`,
      title,
      amount,
      category,
      date: new Date().toISOString().split('T')[0],
      notes
    };
    setSavings(prev => [newItem, ...prev]);

    const newTx: FinancialTransaction = {
      id: `tx-sav-${Date.now()}`,
      type: 'savings_deposit',
      title: `تحويل للادخار: ${title}`,
      amount,
      date: new Date().toISOString().split('T')[0],
      sourceAccount: 'checking',
      destinationAccount: 'savings',
      relatedId: newItem.id,
      notes
    };
    setTransactions(prev => [newTx, ...prev]);

    triggerCelebration();
    showToast(`تم إيداع ${formatCurrency(amount)} ر.س في حساب الادخار وتحويلها من الحساب الجاري بنجاح! ✨`);
    return true;
  };

  const deleteSavings = (id: string) => {
    const target = savings.find(s => s.id === id);
    if (target) {
      setAccountBalances(prev => ({
        ...prev,
        checkingBalance: Math.round((prev.checkingBalance + target.amount) * 100) / 100,
        savingsBalance: Math.max(Math.round((prev.savingsBalance - target.amount) * 100) / 100, 0),
        lastUpdated: new Date().toISOString()
      }));
    }
    setSavings(prev => prev.filter(s => s.id !== id));
    showToast('تم حذف بند الادخار وإعادة المبلغ للرصيد الجاري');
  };

  const logExpense = (
    desc: string,
    amount: number,
    category: ExpenseCategory,
    method: PaymentMethod,
    date?: string
  ): boolean => {
    if (amount <= 0) return false;

    if (accountBalances.checkingBalance < amount) {
      showToast(`⚠️ تنبيه: رصيدك الجاري (${formatCurrency(accountBalances.checkingBalance)} ر.س) أقل من قيمة المصروف (${formatCurrency(amount)} ر.س)`);
    }

    const newChecking = Math.max(Math.round((accountBalances.checkingBalance - amount) * 100) / 100, 0);

    setAccountBalances(prev => ({
      ...prev,
      checkingBalance: newChecking,
      lastUpdated: new Date().toISOString()
    }));

    const newItem: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      desc,
      amount,
      category,
      method,
      date: date || new Date().toISOString().split('T')[0]
    };
    setExpenses(prev => [newItem, ...prev]);

    const newTx: FinancialTransaction = {
      id: `tx-exp-${Date.now()}`,
      type: 'expense',
      title: desc,
      amount,
      date: newItem.date,
      sourceAccount: 'checking',
      destinationAccount: 'external',
      relatedId: newItem.id
    };
    setTransactions(prev => [newTx, ...prev]);

    showToast(`تم تسجيل مصروف "${desc}" (${formatCurrency(amount)} ر.س) وخصمه من الرصيد الجاري`);
    return true;
  };

  const deleteExpense = (id: string) => {
    const target = expenses.find(e => e.id === id);
    if (target) {
      setAccountBalances(prev => ({
        ...prev,
        checkingBalance: Math.round((prev.checkingBalance + target.amount) * 100) / 100,
        lastUpdated: new Date().toISOString()
      }));
    }
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('تم حذف المصروف وإعادة المبلغ للرصيد الجاري');
  };

  const addIncome = (
    title: string,
    amount: number,
    frequency: FrequencyType,
    category: any,
    isRecurring: boolean,
    notes?: string
  ) => {
    const newChecking = Math.round((accountBalances.checkingBalance + amount) * 100) / 100;

    setAccountBalances(prev => ({
      ...prev,
      checkingBalance: newChecking,
      lastUpdated: new Date().toISOString()
    }));

    const newItem: IncomeItem = {
      id: `inc-${Date.now()}`,
      title,
      amount,
      frequency,
      category,
      isRecurring,
      notes
    };
    setIncomes(prev => [newItem, ...prev]);

    const newTx: FinancialTransaction = {
      id: `tx-inc-${Date.now()}`,
      type: 'income',
      title,
      amount,
      date: new Date().toISOString().split('T')[0],
      sourceAccount: 'external',
      destinationAccount: 'checking',
      relatedId: newItem.id,
      notes
    };
    setTransactions(prev => [newTx, ...prev]);

    triggerCelebration();
    showToast(`تم تسجيل دخل جديد "${title}" (+${formatCurrency(amount)} ر.س) وإضافته للرصيد الجاري! 💰`);
  };

  const deleteIncome = (id: string) => {
    const target = incomes.find(i => i.id === id);
    if (target) {
      setAccountBalances(prev => ({
        ...prev,
        checkingBalance: Math.max(Math.round((prev.checkingBalance - target.amount) * 100) / 100, 0),
        lastUpdated: new Date().toISOString()
      }));
    }
    setIncomes(prev => prev.filter(i => i.id !== id));
    showToast('تم حذف بند الدخل');
  };

  const payCarInstallment = () => {
    if (carPlan.paidInstallments >= carPlan.totalInstallments) return;

    if (accountBalances.checkingBalance < carPlan.monthlyInstallment) {
      showToast(`⚠️ تنبيه: رصيدك الجاري (${formatCurrency(accountBalances.checkingBalance)} ر.س) أقل من قسط السيارة (${formatCurrency(carPlan.monthlyInstallment)} ر.س)`);
    }

    const newChecking = Math.max(Math.round((accountBalances.checkingBalance - carPlan.monthlyInstallment) * 100) / 100, 0);
    const updatedPlan: CarPlan = { 
      ...carPlan, 
      paidInstallments: carPlan.paidInstallments + 1,
      isPaidThisMonth: true 
    };

    setAccountBalances(prev => ({
      ...prev,
      checkingBalance: newChecking,
      lastUpdated: new Date().toISOString()
    }));

    setCarPlan(updatedPlan);

    const newTx: FinancialTransaction = {
      id: `tx-car-${Date.now()}`,
      type: 'car_installment',
      title: `سداد قسط السيارة (${updatedPlan.paidInstallments}/${updatedPlan.totalInstallments})`,
      amount: carPlan.monthlyInstallment,
      date: new Date().toISOString().split('T')[0],
      sourceAccount: 'checking',
      destinationAccount: 'external'
    };
    setTransactions(prev => [newTx, ...prev]);

    triggerCelebration();
    showToast(`تم سداد قسط السيارة بنجاح (${updatedPlan.paidInstallments}/${updatedPlan.totalInstallments}) وخصم ${formatCurrency(carPlan.monthlyInstallment)} ر.س من الرصيد الجاري! 🚗`);
  };

  const updateCarPlan = (plan: CarPlan) => {
    setCarPlan(plan);
    showToast('تم تحديث خطة السيارة بنجاح');
  };

  const updateAccountBalances = (checking: number, savings: number) => {
    setAccountBalances({
      checkingBalance: Math.max(Math.round(checking * 100) / 100, 0),
      savingsBalance: Math.max(Math.round(savings * 100) / 100, 0),
      emergencyTarget: accountBalances.emergencyTarget || 0,
      lastUpdated: new Date().toISOString()
    });
    showToast('تم تحديث أرصدة الحسابات البنكية بنجاح! ✨');
  };

  const collectReceivable = (id: string, destination: 'income' | 'bnpl_payoff' | 'savings') => {
    const target = receivables.find(r => r.id === id);
    if (!target) return;

    if (destination === 'income') {
      addIncome(`تحصيل مستحق: ${target.name}`, target.amount, 'one_time', 'مستحقات وسلف', false, target.notes);
    } else if (destination === 'savings') {
      transferToSavings(`تحصيل مستحق لحساب الادخار: ${target.name}`, target.amount, 'صندوق طوارئ', target.notes);
    } else if (destination === 'bnpl_payoff') {
      setAccountBalances(prev => ({
        ...prev,
        checkingBalance: Math.round((prev.checkingBalance + target.amount) * 100) / 100,
        lastUpdated: new Date().toISOString()
      }));
      showToast(`تم تحصيل ${formatCurrency(target.amount)} ر.س وإضافتها للحساب الجاري المتاح لسداد الأقساط! 🎯`);
    }

    setReceivables(prev => prev.map(r => r.id === id ? { ...r, status: 'مستلم' } : r));
  };

  const deleteReceivable = (id: string) => {
    setReceivables(prev => prev.filter(r => r.id !== id));
    showToast('تم حذف المستحق');
  };

  const saveReceivable = (name: string, amount: number, notes?: string) => {
    const newItem: ReceivableRecord = {
      id: `rec-${Date.now()}`,
      name,
      amount,
      status: 'معلق',
      date: new Date().toISOString().split('T')[0],
      notes
    };
    setReceivables(prev => [newItem, ...prev]);
    showToast(`تم تسجيل مستحق جديد لدى ${name}`);
  };

  const saveLiability = (title: string, amount: number, dueDate: string, category: any, notes?: string) => {
    const newItem: LiabilityItem = {
      id: `liab-${Date.now()}`,
      title,
      amount,
      dueDate,
      category,
      status: 'مستحق',
      notes
    };
    setLiabilities(prev => [newItem, ...prev]);
    showToast(`تم تسجّل دين / التزام جديد: ${title}`);
  };

  const deleteLiability = (id: string) => {
    setLiabilities(prev => prev.filter(l => l.id !== id));
    showToast('تم حذف الدين / التزام');
  };

  const saveFixedObligation = (title: string, amount: number, category: any, dueDay?: number, notes?: string) => {
    const newItem: FixedObligation = {
      id: `fix-${Date.now()}`,
      title,
      amount,
      category,
      dueDay,
      notes
    };
    setFixedObligations(prev => [newItem, ...prev]);
    showToast(`تم إضافة التزام ثابت جديد: ${title}`);
  };

  const deleteFixedObligation = (id: string) => {
    setFixedObligations(prev => prev.filter(f => f.id !== id));
    showToast('تم حذف الالتزام الثابت');
  };

  const updateMonth = (updated: MonthlyRecord) => {
    setMonthlyData(prev => prev.map(m => m.id === updated.id ? updated : m));
    showToast('تم تحديث بيانات الشهر في التوقعات');
  };

  const addMonth = (item: MonthlyRecord) => {
    setMonthlyData(prev => [...prev, item]);
    showToast('تم إضافة شهر جديد للتوقعات');
  };

  const deleteMonth = (id: string) => {
    setMonthlyData(prev => prev.filter(m => m.id !== id));
    showToast('تم حذف الشهر من التوقعات');
  };

  const exportBackupJSON = () => {
    const data = {
      incomes,
      carPlan,
      fixedObligations,
      installments,
      expenses,
      savings,
      liabilities,
      receivables,
      monthlyData,
      accountBalances,
      transactions,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `financial_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('تم تصدير النسخة الاحتياطية بنجاح 📥');
  };

  const importBackupJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed) {
          if (Array.isArray(parsed.incomes)) setIncomes(parsed.incomes);
          if (parsed.carPlan) setCarPlan(parsed.carPlan);
          if (Array.isArray(parsed.fixedObligations)) setFixedObligations(parsed.fixedObligations);
          if (Array.isArray(parsed.installments)) setInstallments(parsed.installments);
          if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
          if (Array.isArray(parsed.savings)) setSavings(parsed.savings);
          if (Array.isArray(parsed.liabilities)) setLiabilities(parsed.liabilities);
          if (Array.isArray(parsed.receivables)) setReceivables(parsed.receivables);
          if (Array.isArray(parsed.monthlyData)) setMonthlyData(parsed.monthlyData);
          if (parsed.accountBalances) setAccountBalances(parsed.accountBalances);
          if (Array.isArray(parsed.transactions)) setTransactions(parsed.transactions);
          
          showToast('تم استيراد النسخة الاحتياطية وتطبيق البيانات بنجاح! 🚀');
          triggerCelebration();
        }
      } catch (err) {
        showToast('❌ تعذر استيراد الملف. يرجى التثبت من صحة تنسيق JSON');
      }
    };
    reader.readAsText(file);
  };

  // Reset to Factory Clean Template Zero Default
  const resetAllData = async () => {
    setIncomes(INITIAL_INCOMES);
    setCarPlan(INITIAL_CAR_PLAN);
    setFixedObligations(INITIAL_FIXED_OBLIGATIONS);
    setInstallments(INITIAL_INSTALLMENTS);
    setExpenses(INITIAL_EXPENSES);
    setSavings(INITIAL_SAVINGS);
    setLiabilities(INITIAL_LIABILITIES);
    setReceivables(INITIAL_RECEIVABLES);
    setMonthlyData(INITIAL_MONTHLY_DATA);
    setAccountBalances(INITIAL_ACCOUNT_BALANCES);
    setTransactions([]);

    if (user) {
      const docPath = `users/${user.uid}/data/financial_dashboard`;
      const cleanData = {
        userId: user.uid,
        incomes: INITIAL_INCOMES,
        carPlan: INITIAL_CAR_PLAN,
        fixedObligations: INITIAL_FIXED_OBLIGATIONS,
        installments: INITIAL_INSTALLMENTS,
        expenses: INITIAL_EXPENSES,
        savings: INITIAL_SAVINGS,
        liabilities: INITIAL_LIABILITIES,
        receivables: INITIAL_RECEIVABLES,
        monthlyData: INITIAL_MONTHLY_DATA,
        accountBalances: INITIAL_ACCOUNT_BALANCES,
        transactions: [],
        updatedAt: new Date().toISOString()
      };
      try {
        await setDoc(doc(db, 'users', user.uid, 'data', 'financial_dashboard'), sanitizeForFirestore(cleanData));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      }
    }

    localStorage.clear();
    showToast('تم تصفير كافة البيانات وبدء سستم جديد بنجاح! 🧼');
    triggerCelebration();
  };

  const resetToZeroTestMode = () => {
    resetAllData();
  };

  return (
    <FinancialContext.Provider
      value={{
        dataLoading,
        saveStatus,
        incomes,
        carPlan,
        fixedObligations,
        installments,
        expenses,
        savings,
        liabilities,
        receivables,
        monthlyData: computedMonthlyData,
        accountBalances,
        transactions,
        toastMessage,

        totalIncome,
        totalFixed,
        totalBNPL,
        totalPersonalExpenses,
        totalSavings,
        discretionaryNet,
        netSavingsMonthly,
        unpaidCommitments,
        totalNetLiquidity,
        realAvailableLiquidity,

        setIncomes,
        setFixedObligations,
        setCarPlan,
        setInstallments,
        setExpenses,
        setSavings,
        setLiabilities,
        setReceivables,
        setMonthlyData,
        setAccountBalances,
        setTransactions,

        payInstallment,
        undoPayInstallment,
        toggleInstallmentStatus,
        deleteInstallment,
        saveInstallment,
        updateInstallment,

        transferToSavings,
        deleteSavings,

        logExpense,
        deleteExpense,

        addIncome,
        deleteIncome,

        payCarInstallment,
        updateCarPlan,

        updateAccountBalances,
        collectReceivable,
        deleteReceivable,
        saveReceivable,

        saveLiability,
        deleteLiability,

        saveFixedObligation,
        deleteFixedObligation,

        updateMonth,
        addMonth,
        deleteMonth,

        exportBackupJSON,
        importBackupJSON,
        resetAllData,
        resetToZeroTestMode,
        showToast
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancialState = (): FinancialContextType => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancialState must be used within a FinancialProvider');
  }
  return context;
};
