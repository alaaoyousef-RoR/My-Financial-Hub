import { doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { sanitizeForFirestore } from '../context/FinancialContext';
import { CleanSlateFinancialState, UserProfile } from '../types/userProfile';
import { FinancialTransaction, ExpenseRecord } from '../types/finance';

/**
 * Checks whether the user has an initialized financial document in Firestore.
 */
export async function checkUserInitialized(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const docRef = doc(db, 'users', userId, 'data', 'financial_dashboard');
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (err) {
    console.error('[userService] Error checking user initialization:', err);
    return false;
  }
}

/**
 * Generates a clean zeroed baseline state for new users starting from scratch.
 */
export function createDefaultZeroState(userId: string): CleanSlateFinancialState {
  const now = new Date().toISOString();
  return {
    userId,
    incomes: [],
    carPlan: {
      monthlyInstallment: 0,
      totalInstallments: 0,
      paidInstallments: 0,
      balloonPayment: 0,
      isPaidThisMonth: false
    },
    fixedObligations: [],
    installments: [],
    expenses: [],
    savings: [],
    liabilities: [],
    receivables: [],
    monthlyData: [],
    accountBalances: {
      checkingBalance: 0,
      savingsBalance: 0,
      emergencyTarget: 0,
      isMasked: false,
      lastUpdated: now
    },
    transactions: [],
    openingBalance: 0,
    currentBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    isSetupComplete: false,
    updatedAt: now
  };
}

/**
 * Initializes a new user document in Firestore with zeroed metrics if it doesn't already exist.
 */
export async function initializeUserProfile(
  userId: string,
  userEmail?: string | null
): Promise<{ success: boolean; data: CleanSlateFinancialState; alreadyExisted: boolean }> {
  if (!userId) {
    throw new Error('User ID is required for initialization.');
  }

  const docRef = doc(db, 'users', userId, 'data', 'financial_dashboard');
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      success: true,
      data: docSnap.data() as CleanSlateFinancialState,
      alreadyExisted: true
    };
  }

  const defaultState = createDefaultZeroState(userId);
  const sanitized = sanitizeForFirestore(defaultState);

  await setDoc(docRef, sanitized);
  console.log('[userService] Initialized new zero-state user profile in Firestore ✓');

  return {
    success: true,
    data: defaultState,
    alreadyExisted: false
  };
}

/**
 * Atomically updates user starting balance and logs an initial opening transaction
 * in both Firestore and returns the updated structures.
 */
export async function setStartingOpeningBalance(
  userId: string,
  startingBalance: number,
  notes: string = 'رصيد افتتاحي لبدء التتبع'
): Promise<{
  success: boolean;
  newBalance: number;
  initialTransaction: FinancialTransaction;
  initialExpenseRecord: ExpenseRecord;
}> {
  if (!userId) throw new Error('User ID is required.');
  const cleanBalance = Math.max(Math.round(startingBalance * 100) / 100, 0);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timestamp = now.toISOString();

  // Create audit transaction for ledger integrity
  const initialTransaction: FinancialTransaction = {
    id: `tx-init-${Date.now()}`,
    type: 'income',
    title: notes,
    amount: cleanBalance,
    date: dateStr,
    sourceAccount: 'external',
    destinationAccount: 'checking',
    notes: `تم ضبط الرصيد الافتتاحي للحساب الجاري: ${cleanBalance.toLocaleString('ar-SA')} ر.س`
  };

  // Create a corresponding top-up record if amount > 0
  const initialExpenseRecord: ExpenseRecord = {
    id: `exp-init-${Date.now()}`,
    desc: notes,
    amount: cleanBalance,
    category: 'تغذية مخصص',
    method: 'تحويل بنكي',
    date: dateStr,
    type: 'TOP_UP'
  };

  const docRef = doc(db, 'users', userId, 'data', 'financial_dashboard');
  const docSnap = await getDoc(docRef);

  const batch = writeBatch(db);

  if (docSnap.exists()) {
    const existing = docSnap.data();
    const existingExpenses = Array.isArray(existing.expenses) ? existing.expenses : [];
    const existingTx = Array.isArray(existing.transactions) ? existing.transactions : [];

    const updatedAccountBalances = {
      ...(existing.accountBalances || { savingsBalance: 0, emergencyTarget: 0, isMasked: false }),
      checkingBalance: cleanBalance,
      lastUpdated: timestamp
    };

    const updatePayload = sanitizeForFirestore({
      openingBalance: cleanBalance,
      currentBalance: cleanBalance,
      isSetupComplete: true,
      accountBalances: updatedAccountBalances,
      expenses: cleanBalance > 0 ? [initialExpenseRecord, ...existingExpenses] : existingExpenses,
      transactions: [initialTransaction, ...existingTx],
      updatedAt: timestamp
    });

    batch.set(docRef, updatePayload, { merge: true });
  } else {
    const freshState = createDefaultZeroState(userId);
    freshState.openingBalance = cleanBalance;
    freshState.currentBalance = cleanBalance;
    freshState.isSetupComplete = true;
    freshState.accountBalances.checkingBalance = cleanBalance;
    if (cleanBalance > 0) {
      freshState.expenses = [initialExpenseRecord];
    }
    freshState.transactions = [initialTransaction];

    batch.set(docRef, sanitizeForFirestore(freshState));
  }

  await batch.commit();

  return {
    success: true,
    newBalance: cleanBalance,
    initialTransaction,
    initialExpenseRecord
  };
}
