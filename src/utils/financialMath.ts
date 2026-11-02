import { 
  FixedObligation, 
  CarPlan, 
  InstallmentRecord, 
  IncomeItem, 
  SavingsItem, 
  ExpenseRecord,
  AccountBalancesState
} from '../types/finance';

/**
 * Single Source of Truth for Financial Calculations.
 * Ensures consistent mathematical logic across all components without double counting
 * and safely handles negative cash balances.
 */

/**
 * 1. Total Fixed Monthly Commitments
 * Guarantees the car loan is NOT double counted between FixedObligations and CarPlan.
 */
export function calculateTotalFixed(
  fixedObligations: FixedObligation[] = [],
  carPlan: CarPlan = { monthlyInstallment: 0, totalInstallments: 0, paidInstallments: 0, balloonPayment: 0 }
): number {
  // Sum obligations that are not 'سيارة'
  const nonCarFixed = fixedObligations
    .filter(item => item.category !== 'سيارة' && !item.title.includes('سيارة') && !item.title.includes('تمويل'))
    .reduce((sum, item) => sum + Math.max(Number(item.amount) || 0, 0), 0);

  // Add the car installment once if active
  const carInstallment = (carPlan.paidInstallments < carPlan.totalInstallments)
    ? Math.max(Number(carPlan.monthlyInstallment) || 0, 0)
    : 0;

  return Math.round((nonCarFixed + carInstallment) * 100) / 100;
}

/**
 * 2. Active BNPL Commitments for a Month Offset N
 * For a future month at offset N (0 = current, 1 = +1 month, etc.):
 * - For each installment: projectedPaid = currentPaidCount + N.
 * - If projectedPaid < totalInstallments, include 1 monthly installment in that month's total.
 * - If projectedPaid >= totalInstallments, the installment is fully paid: contribution is 0.00.
 */
export function calculateActiveBNPL(
  installments: InstallmentRecord[] = [],
  monthIndex: number = 0
): { totalBNPL: number; tamara: number; tabby: number } {
  const N = Math.max(Number(monthIndex) || 0, 0);
  let tamara = 0;
  let tabby = 0;

  for (const plan of installments) {
    if (plan.status !== 'active') continue;

    const totalMonths = plan.totalMonths || Math.max((plan.paidMonths || 0) + plan.remainingMonths, 1);
    const currentPaidCount = plan.paidMonths ?? Math.max(totalMonths - plan.remainingMonths, 0);

    const projectedPaid = currentPaidCount + N;

    if (projectedPaid < totalMonths) {
      const amt = Math.max(Number(plan.amount) || 0, 0);
      if (plan.platform === 'Tamara') tamara += amt;
      else if (plan.platform === 'Tabby') tabby += amt;
    }
  }

  const roundedTamara = Math.round(tamara * 100) / 100;
  const roundedTabby = Math.round(tabby * 100) / 100;
  const totalBNPL = Math.round((roundedTamara + roundedTabby) * 100) / 100;

  return { totalBNPL, tamara: roundedTamara, tabby: roundedTabby };
}

/**
 * 3. Unpaid Commitments Remaining for Current Month
 * Guarantees NO DUPLICATE DEDUCTIONS:
 * - Only counts commitments that have NOT yet been paid/deducted from checking this month.
 * - If car loan or an installment was already paid, it is excluded here to avoid double-charging.
 */
export function calculateUnpaidMonthCommitments(
  fixedObligations: FixedObligation[] = [],
  carPlan: CarPlan = { monthlyInstallment: 0, totalInstallments: 0, paidInstallments: 0, balloonPayment: 0 },
  installments: InstallmentRecord[] = []
): number {
  // Unpaid fixed obligations: only those not marked as paid this month
  const unpaidNonCarFixed = fixedObligations
    .filter(item => item.category !== 'سيارة' && !item.title.includes('سيارة') && !item.title.includes('تمويل') && !item.isPaidThisMonth)
    .reduce((sum, item) => sum + Math.max(Number(item.amount) || 0, 0), 0);

  // Unpaid car installment: only if car loan is active AND has not been paid this month
  const unpaidCarInstallment = (carPlan.paidInstallments < carPlan.totalInstallments && !carPlan.isPaidThisMonth)
    ? Math.max(Number(carPlan.monthlyInstallment) || 0, 0)
    : 0;

  // Unpaid BNPL installments: active, not paid this month, and remaining months > 0
  const unpaidBNPL = installments
    .filter(i => i.status === 'active' && !i.isPaidThisMonth && i.remainingMonths > 0)
    .reduce((sum, i) => sum + Math.max(Number(i.amount) || 0, 0), 0);

  return Math.round((unpaidNonCarFixed + unpaidCarInstallment + unpaidBNPL) * 100) / 100;
}

/**
 * 4. Net Real Available Liquidity (السيولة المتاحة الحقيقية)
 * The unencumbered cash currently available in checking after reserving funds
 * for all remaining unpaid commitments of the month.
 * 
 * Safely handles negative cash: Cash in hand cannot be negative. If unpaid commitments
 * exceed checking balance, available spending cash is clamped to 0.00 rather than displaying negative cash.
 */
export function calculateLiquidity(
  checkingBalance: number,
  unpaidMonthCommitments: number
): number {
  const balance = Math.max(Number(checkingBalance) || 0, 0);
  const commitments = Math.max(Number(unpaidMonthCommitments) || 0, 0);
  const rawLiquidity = balance - commitments;

  // Clamp to 0 to safely handle negative cash values
  return Math.max(Math.round(rawLiquidity * 100) / 100, 0);
}

// Alias for backwards compatibility
export const calculateNetRealLiquidity = calculateLiquidity;

/**
 * 5. Monthly Free Cash (صافي الدخل الحر المتاح)
 * Unified formula: Total Monthly Income - Total Fixed Commitments - Active Month BNPL - Monthly Savings Target.
 * 
 * Safely handles negative values: Free discretionary income cannot be negative.
 * If obligations exceed income, available free cash is cleanly clamped to 0.00.
 */
export function calculateMonthlyNet(
  totalMonthlyIncome: number,
  totalFixedCommitments: number,
  activeMonthBNPL: number,
  monthlySavingsTarget: number = 0
): number {
  const income = Math.max(Number(totalMonthlyIncome) || 0, 0);
  const fixed = Math.max(Number(totalFixedCommitments) || 0, 0);
  const bnpl = Math.max(Number(activeMonthBNPL) || 0, 0);
  const savings = Math.max(Number(monthlySavingsTarget) || 0, 0);

  const rawNet = income - fixed - bnpl - savings;

  // Free discretionary cash cannot be negative; clean zero floor
  return Math.max(Math.round(rawNet * 100) / 100, 0);
}

// Alias for backwards compatibility
export const calculateMonthlyFreeCash = calculateMonthlyNet;

/**
 * 6. Total Liquid Net Worth (إجمالي السيولة الشاملة)
 * Checking Balance + Savings Balance.
 */
export function calculateTotalLiquidNetWorth(
  checkingBalance: number,
  savingsBalance: number
): number {
  const checking = Math.max(Number(checkingBalance) || 0, 0);
  const savings = Math.max(Number(savingsBalance) || 0, 0);
  return Math.round((checking + savings) * 100) / 100;
}

/**
 * 7. Live Daily Progression & Safe Spending
 * Computes remaining days in the week, day index, and daily safe-to-spend allowance.
 */
export function calculateDailyProgression(
  weeklyAllowance: number,
  weeklySpent: number,
  now: Date = new Date()
) {
  const dayOfWeek = now.getDay();
  const daysInWeek = 7;
  const currentDayNumberInWeek = dayOfWeek === 6 ? 1 : dayOfWeek + 2; 
  const remainingDaysInWeek = Math.max(daysInWeek - currentDayNumberInWeek + 1, 1);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDayOfMonth = now.getDate();
  const remainingDaysInMonth = Math.max(totalDaysInMonth - currentDayOfMonth, 0);

  const currentWeekIndex = Math.min(Math.ceil(currentDayOfMonth / 7), 4);

  const allowance = Math.max(Number(weeklyAllowance) || 0, 0);
  const spent = Math.max(Number(weeklySpent) || 0, 0);
  const remainingWeeklyBudget = Math.max(allowance - spent, 0);
  const dailySafeToSpend = Math.round((remainingWeeklyBudget / remainingDaysInWeek) * 100) / 100;

  return {
    currentDayOfMonth,
    totalDaysInMonth,
    remainingDaysInMonth,
    currentWeekIndex,
    remainingDaysInWeek,
    remainingWeeklyBudget,
    dailySafeToSpend
  };
}

export interface ProjectedMonthDetails {
  targetMonthIndex: number;
  projectedIncome: number;
  projectedFixed: number;
  projectedBNPL: number;
  projectedTamara: number;
  projectedTabby: number;
  projectedCar: number;
  projectedDiscretionaryNet: number;
  projectedCheckingBalance: number;
  projectedSavingsBalance: number;
  isZeroDebtMonth: boolean;
  activeInstallmentsCount: number;
}

/**
 * 8. Pure Deterministic Minimal Future Projection Engine
 * Refactored Minimal Simulation Rules:
 * - Static Monthly Income: Base Recurring Income (constant across future months)
 * - Static Fixed Commitments: Base Fixed Obligations + Car Loan (if projectedPaid < totalInstallments)
 * - Dynamic Installment Obligations: For each installment, projectedPaid = currentPaidCount + N.
 *   If projectedPaid < totalInstallments, include 1 monthly payment.
 *   If projectedPaid >= totalInstallments, contribution is 0.00.
 * - Pure Net Remaining Formula (No Rolling Cumulative Inflation):
 *   Projected Free Balance = Projected Income - Projected Fixed - Total Projected Installments
 */
export function calculateProjectedMonth(
  state: {
    incomes: IncomeItem[];
    fixedObligations: FixedObligation[];
    carPlan: CarPlan;
    installments: InstallmentRecord[];
    accountBalances: AccountBalancesState;
  },
  targetMonthIndex: number = 0
): ProjectedMonthDetails {
  const { incomes, fixedObligations, carPlan, installments, accountBalances } = state;
  const N = Math.max(Number(targetMonthIndex) || 0, 0);

  // 1. Static Monthly Income
  const projectedIncome = incomes.reduce(
    (sum, item) => sum + Math.max(Number(item.amount) || 0, 0), 
    0
  );

  // 2. Dynamic Car Installment at Offset N
  const projectedCarPaid = (carPlan.paidInstallments || 0) + N;
  const isCarActive = projectedCarPaid < carPlan.totalInstallments;
  const projectedCar = isCarActive ? Math.max(Number(carPlan.monthlyInstallment) || 0, 0) : 0;

  // 3. Static Fixed Obligations + Active Car Loan
  const nonCarFixed = fixedObligations
    .filter(item => item.category !== 'سيارة' && !item.title.includes('سيارة') && !item.title.includes('تمويل'))
    .reduce((sum, item) => sum + Math.max(Number(item.amount) || 0, 0), 0);
  const projectedFixed = nonCarFixed + projectedCar;

  // 4. Dynamic BNPL Installments at Offset N (Tamara & Tabby)
  const { totalBNPL: projectedBNPL, tamara: projectedTamara, tabby: projectedTabby } = calculateActiveBNPL(
    installments,
    N
  );

  // Count active installment plans at Offset N
  const activeInstallmentsCount = installments.filter(plan => {
    if (plan.status !== 'active') return false;
    const totalMonths = plan.totalMonths || Math.max((plan.paidMonths || 0) + plan.remainingMonths, 1);
    const currentPaidCount = plan.paidMonths ?? Math.max(totalMonths - plan.remainingMonths, 0);
    return (currentPaidCount + N) < totalMonths;
  }).length;

  // 5. Clear Net Remaining Formula (No Rolling Cumulative Inflation or compounding loops)
  // Projected Free Balance = Projected Income - Projected Fixed Expenses - Total Projected Installments
  const rawNet = projectedIncome - projectedFixed - projectedBNPL;
  const projectedDiscretionaryNet = Math.max(rawNet, 0);

  // Live account balances without cumulative multiplication
  const projectedCheckingBalance = Math.max(Number(accountBalances.checkingBalance) || 0, 0);
  const projectedSavingsBalance = Math.max(Number(accountBalances.savingsBalance) || 0, 0);

  return {
    targetMonthIndex: N,
    projectedIncome: Math.round(projectedIncome * 100) / 100,
    projectedFixed: Math.round(projectedFixed * 100) / 100,
    projectedBNPL: Math.round(projectedBNPL * 100) / 100,
    projectedTamara: Math.round(projectedTamara * 100) / 100,
    projectedTabby: Math.round(projectedTabby * 100) / 100,
    projectedCar: Math.round(projectedCar * 100) / 100,
    projectedDiscretionaryNet: Math.round(projectedDiscretionaryNet * 100) / 100,
    projectedCheckingBalance: Math.round(projectedCheckingBalance * 100) / 100,
    projectedSavingsBalance: Math.round(projectedSavingsBalance * 100) / 100,
    isZeroDebtMonth: projectedBNPL === 0,
    activeInstallmentsCount
  };
}

export interface WeeklyBucketInput {
  id: number;
  name: string;
  startDay: number;
  endDay: number;
  daysCount: number;
  weeklyCap: number;
  dailyAllowance?: number;
  isActive: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface WeeklyAllocationResult {
  bucket: WeeklyBucketInput & { effectiveCap: number };
  spent: number;
  topUps: number;
  remaining: number;
  allocatedAmount: number;
  percentage: number;
  itemsCount: number;
  expenses: ExpenseRecord[];
}

export interface ComputeWeeklyAllocationsParams {
  buckets: WeeklyBucketInput[];
  expenses: ExpenseRecord[];
  actualCurrentBalance: number;
  monthlyBudget: number;
  currentDay: number;
  totalDaysInMonth: number;
}

export interface WeeklyAllocationsOutput {
  summaries: WeeklyAllocationResult[];
  activeWeekRemaining: number;
  dailySafeLimit: number;
  accumulatedExpenses: number;
  totalTopUps: number;
  calculatedTheoreticalBalance: number;
  activeSummary: WeeklyAllocationResult;
}

/**
 * 9. computeWeeklyAllocations
 * Rebalances and distributes actual funds and planned budgets across the 5 weekly buckets.
 * Guarantees that active and future weeks reflect their real or planned remaining funds
 * without ever dropping to 0.00 unless actually depleted.
 */
export function computeWeeklyAllocations({
  buckets,
  expenses = [],
  actualCurrentBalance,
  monthlyBudget,
  currentDay,
  totalDaysInMonth
}: ComputeWeeklyAllocationsParams): WeeklyAllocationsOutput {
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

  // 1. Core monthly metrics
  const accumulatedExpenses = expenses
    .filter((e) => e.amount > 0 && e.category !== 'تغذية مخصص' && e.type !== 'TOP_UP')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalTopUps = expenses
    .filter((e) => e.type === 'TOP_UP' || e.category === 'تغذية مخصص' || e.amount < 0)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);

  const calculatedTheoreticalBalance = Math.max(monthlyBudget + totalTopUps - accumulatedExpenses, 0);

  // 2. Identify active and future buckets
  const activeBucket = buckets.find((b) => b.isActive) || buckets[0];
  const futureBuckets = buckets.filter((b) => b.isFuture);
  const daysRemainingInActiveWeek = Math.max(activeBucket.endDay - currentDay + 1, 1);
  const remainingDaysInMonth = Math.max(totalDaysInMonth - currentDay + 1, 1);

  // Per-bucket positive expenses and top-ups
  const bucketExpenseMap = new Map<number, { spent: number; topUps: number; items: ExpenseRecord[] }>();
  for (const b of buckets) {
    const bucketItems = expenses.filter((e) => {
      const d = getExpenseDay(e.date);
      return d >= b.startDay && d <= b.endDay;
    });

    const spent = bucketItems
      .filter((e) => e.amount > 0 && e.category !== 'تغذية مخصص' && e.type !== 'TOP_UP')
      .reduce((sum, e) => sum + e.amount, 0);

    const topUps = bucketItems
      .filter((e) => e.type === 'TOP_UP' || e.category === 'تغذية مخصص' || e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    bucketExpenseMap.set(b.id, { spent, topUps, items: bucketItems });
  }

  const activeExpData = bucketExpenseMap.get(activeBucket.id) || { spent: 0, topUps: 0, items: [] };
  const baselineActiveRemaining = Math.max(activeBucket.weeklyCap + activeExpData.topUps - activeExpData.spent, 0);

  // Total baseline planned sum for upcoming weeks
  const futurePlannedSum = futureBuckets.reduce((sum, b) => sum + b.weeklyCap, 0);

  // 3. Compute activeWeekRemaining and future allocations based on actualCurrentBalance
  let activeWeekRemaining = baselineActiveRemaining;
  const futureAllocations = new Map<number, number>();

  if (actualCurrentBalance > 0) {
    if (actualCurrentBalance >= futurePlannedSum) {
      // Ample funds: preserve full planned budgets for all future weeks
      // Active week absorbs surplus/funds after safeguarding future planned allowances
      activeWeekRemaining = Math.max(actualCurrentBalance - futurePlannedSum, 0);

      const surplus = actualCurrentBalance - (futurePlannedSum + baselineActiveRemaining);
      for (const b of futureBuckets) {
        if (surplus > 0) {
          // Proportionally share any extra surplus based on days
          const extra = Math.round(surplus * (b.daysCount / remainingDaysInMonth));
          futureAllocations.set(b.id, b.weeklyCap + extra);
        } else {
          futureAllocations.set(b.id, b.weeklyCap);
        }
      }
    } else {
      // Balance is tighter than total planned requirements:
      // Distribute actual balance proportionally across remaining active days and future weeks
      // so NO future week ever displays 0.00!
      const activeRatio = daysRemainingInActiveWeek / remainingDaysInMonth;
      activeWeekRemaining = Math.max(Math.round(actualCurrentBalance * activeRatio), 0);

      for (const b of futureBuckets) {
        const futureRatio = b.daysCount / remainingDaysInMonth;
        const allocated = Math.max(Math.round(actualCurrentBalance * futureRatio), 0);
        futureAllocations.set(b.id, allocated);
      }
    }
  } else if (actualCurrentBalance === 0) {
    // If balance is explicitly zeroed out
    activeWeekRemaining = 0;
    for (const b of futureBuckets) {
      futureAllocations.set(b.id, 0);
    }
  } else {
    // Fallback baseline
    for (const b of futureBuckets) {
      futureAllocations.set(b.id, b.weeklyCap);
    }
  }

  // 4. Compute dailySafeLimit
  let dailySafeLimit = 0;
  if (daysRemainingInActiveWeek > 0 && activeWeekRemaining > 0) {
    dailySafeLimit = Math.max(Math.floor(activeWeekRemaining / daysRemainingInActiveWeek), 0);
  } else if (actualCurrentBalance > 0 && remainingDaysInMonth > 0) {
    dailySafeLimit = Math.max(Math.floor(actualCurrentBalance / remainingDaysInMonth), 0);
  } else {
    dailySafeLimit = activeBucket.dailyAllowance || 0;
  }

  // 5. Build weekly summary results
  const summaries: WeeklyAllocationResult[] = buckets.map((b) => {
    const data = bucketExpenseMap.get(b.id) || { spent: 0, topUps: 0, items: [] };
    let remaining = 0;
    let effectiveCap = b.weeklyCap;

    if (b.isPast) {
      effectiveCap = b.weeklyCap;
      remaining = Math.max(b.weeklyCap - data.spent, 0);
    } else if (b.isActive) {
      effectiveCap = b.weeklyCap + data.topUps;
      remaining = activeWeekRemaining;
    } else {
      // Future week: guaranteed non-zero planned budget or rebalanced actual allocation
      const allocated = futureAllocations.get(b.id) ?? b.weeklyCap;
      effectiveCap = allocated > 0 ? allocated : b.weeklyCap;
      remaining = Math.max(allocated - data.spent, 0);
    }

    const percentage = effectiveCap > 0 
      ? Math.round((data.spent / effectiveCap) * 100) 
      : (data.spent > 0 ? 100 : 0);

    return {
      bucket: {
        ...b,
        effectiveCap
      },
      spent: data.spent,
      topUps: data.topUps,
      remaining,
      allocatedAmount: effectiveCap,
      percentage,
      itemsCount: data.items.length,
      expenses: data.items
    };
  });

  const activeSummary = summaries.find((s) => s.bucket.id === activeBucket.id) || summaries[0];

  return {
    summaries,
    activeWeekRemaining,
    dailySafeLimit,
    accumulatedExpenses,
    totalTopUps,
    calculatedTheoreticalBalance,
    activeSummary
  };
}

// Re-export pure domain calculators
export {
  deductInstallmentFromBalance,
  calculateDynamicAllowance,
  calculateRemainingFixedLiabilities,
  simulateBNPLSchedule
} from './financeCalculators';
export type { BalanceDeductionResult } from './financeCalculators';
