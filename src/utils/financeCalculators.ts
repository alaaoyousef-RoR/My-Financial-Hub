/**
 * Pure Financial Calculators and Domain Rules Engine
 * Implements deterministic math for:
 * 1. Auto-Deductions & Unified Cash Flow (Settlement methods: CHECKING_ACCOUNT, EXTERNAL, PREPAID)
 * 2. Dynamic Allowance & Safe Daily/Weekly Burn Rate
 * 3. Multi-Month BNPL Simulation across contract tenures (Tamara & Tabby)
 * 
 * Strictly pure functions with zero UI dependencies or side-effects.
 */

import {
  SettlementMethod,
  InstallmentPlan,
  CarPlan,
  FixedObligation,
  BNPLMonthlySimulation,
  SimulatedInstallmentItem,
  DynamicAllowanceResult,
  AllowanceHealthStatus,
  PlatformType
} from '../types/types';
import {
  getCurrentYearMonth,
  getMonthOffset,
  addMonthsToYearMonth,
  parseYearMonth,
  getDaysInMonth
} from './dateFilters';

export interface BalanceDeductionResult {
  newBalance: number;
  deductedAmount: number;
  isDeductedFromChecking: boolean;
  wasOverdraft: boolean;
  paymentMethod: SettlementMethod;
  transactionNote: string;
}

/**
 * 1. Deduct Installment From Balance
 * Directly deducts the installment amount from the checking account balance
 * if and only if the payment method is 'CHECKING_ACCOUNT'.
 * External and Prepaid settlements adjust obligations without reducing checking balance.
 */
export function deductInstallmentFromBalance(
  balance: number,
  installmentAmount: number,
  paymentMethod: SettlementMethod = 'CHECKING_ACCOUNT'
): BalanceDeductionResult {
  const currentBalance = Math.max(Number(balance) || 0, 0);
  const amount = Math.max(Number(installmentAmount) || 0, 0);

  if (paymentMethod === 'CHECKING_ACCOUNT') {
    const wasOverdraft = currentBalance < amount;
    const newBalance = Math.max(Math.round((currentBalance - amount) * 100) / 100, 0);
    return {
      newBalance,
      deductedAmount: amount,
      isDeductedFromChecking: true,
      wasOverdraft,
      paymentMethod,
      transactionNote: wasOverdraft
        ? `خصم مباشر من الحساب الجاري مع تجاوز للرصيد المتاح (-${amount.toFixed(2)} ر.س)`
        : `خصم مباشر ومؤكد من الحساب الجاري (-${amount.toFixed(2)} ر.س)`
    };
  }

  if (paymentMethod === 'PREPAID') {
    return {
      newBalance: currentBalance,
      deductedAmount: 0,
      isDeductedFromChecking: false,
      wasOverdraft: false,
      paymentMethod: 'PREPAID',
      transactionNote: `تسوية مسبقة مدفوعة مقدماً، لم يتم خصم أي مبالغ من الرصيد الجاري الحالي`
    };
  }

  // EXTERNAL payment method
  return {
    newBalance: currentBalance,
    deductedAmount: 0,
    isDeductedFromChecking: false,
    wasOverdraft: false,
    paymentMethod: 'EXTERNAL',
    transactionNote: `تم السداد من حساب خارجي/بطاقة بديلة، لم يتم خصم الرصيد الجاري المرتبط`
  };
}

/**
 * 2. Calculate Dynamic Allowance
 * Derives the personal discretionary allowance from checking account balance
 * minus all pending critical obligations, apportioned across the remaining days of the month.
 */
export function calculateDynamicAllowance(
  checkingBalance: number,
  remainingFixedLiabilities: number,
  daysRemainingInMonth: number
): DynamicAllowanceResult {
  const balance = Math.max(Number(checkingBalance) || 0, 0);
  const liabilities = Math.max(Number(remainingFixedLiabilities) || 0, 0);

  // Available liquid pool for personal discretionary spending
  const availableAllowancePool = Math.max(Math.round((balance - liabilities) * 100) / 100, 0);

  // Safe days distribution
  const safeDays = Math.max(Math.floor(daysRemainingInMonth), 0);
  const daysDenominator = safeDays > 0 ? safeDays : 1;

  const dailyAllowance = Math.round((availableAllowancePool / daysDenominator) * 100) / 100;
  const weeklyAllowance = Math.round((dailyAllowance * 7) * 100) / 100;

  // Derive health status
  let status: AllowanceHealthStatus = 'HEALTHY';
  let burnRateExplanation = 'الرصيد يغطي جميع الالتزامات مع هامش إنفاق يومي مريح.';

  if (balance < liabilities) {
    status = 'DEFICIT';
    const deficitAmount = (liabilities - balance).toFixed(2);
    burnRateExplanation = `عجز في السيولة بمقدار (${deficitAmount} ر.س) لتغطية الالتزامات الحرجة المتبقية لهذا الشهر. يُنصح بتعليق المصاريف الشخصية.`;
  } else if (dailyAllowance < 60 || availableAllowancePool < 500) {
    status = 'TIGHT';
    burnRateExplanation = 'هامش المصروف اليومي مقيد ومحدود. التزم بالحد الأقصى اليومي لتفادي نفاد الرصيد قبل نهاية الشهر.';
  }

  return {
    checkingBalance: balance,
    remainingFixedLiabilities: liabilities,
    availableAllowancePool,
    daysRemainingInMonth: safeDays,
    dailyAllowance,
    weeklyAllowance,
    status,
    burnRateExplanation
  };
}

/**
 * Calculates remaining critical fixed obligations for the active month:
 * - Unpaid non-car fixed expenses
 * - Unpaid active car loan installment
 * - Unpaid active BNPL installments
 */
export function calculateRemainingFixedLiabilities(
  fixedObligations: FixedObligation[] = [],
  carPlan: CarPlan = { monthlyInstallment: 0, totalInstallments: 0, paidInstallments: 0, balloonPayment: 0 },
  installments: InstallmentPlan[] = []
): {
  totalRemaining: number;
  unpaidFixed: number;
  unpaidCar: number;
  unpaidBNPL: number;
} {
  const unpaidFixed = fixedObligations
    .filter(f => !f.isPaidThisMonth && f.category !== 'سيارة' && !f.title.includes('سيارة') && !f.title.includes('تمويل'))
    .reduce((sum, f) => sum + Math.max(Number(f.amount) || 0, 0), 0);

  const isCarActive = (carPlan.paidInstallments || 0) < (carPlan.totalInstallments || 0);
  const unpaidCar = (isCarActive && !carPlan.isPaidThisMonth)
    ? Math.max(Number(carPlan.monthlyInstallment) || 0, 0)
    : 0;

  const unpaidBNPL = installments
    .filter(i => i.status === 'active' && !i.isPaidThisMonth && i.remainingMonths > 0)
    .reduce((sum, i) => sum + Math.max(Number(i.amount) || 0, 0), 0);

  const totalRemaining = Math.round((unpaidFixed + unpaidCar + unpaidBNPL) * 100) / 100;

  return {
    totalRemaining,
    unpaidFixed: Math.round(unpaidFixed * 100) / 100,
    unpaidCar: Math.round(unpaidCar * 100) / 100,
    unpaidBNPL: Math.round(unpaidBNPL * 100) / 100
  };
}

/**
 * 3. Simulate BNPL Schedule (Tabby & Tamara)
 * Recalculates active contracts, upcoming monthly dues, and projected end dates
 * when switching between current and future/past months.
 */
export function simulateBNPLSchedule(
  installmentsList: InstallmentPlan[] = [],
  targetMonthYear: string,
  baseMonthYear: string = getCurrentYearMonth()
): BNPLMonthlySimulation {
  const monthOffset = getMonthOffset(targetMonthYear, baseMonthYear);

  let totalUpcomingDues = 0;
  let tamaraUpcomingDues = 0;
  let tabbyUpcomingDues = 0;
  let totalRemainingDebt = 0;

  const schedule: SimulatedInstallmentItem[] = installmentsList.map((plan) => {
    const monthlyAmount = Math.max(Number(plan.amount) || 0, 0);
    const totalTenure = plan.totalMonths || Math.max((plan.paidMonths || 0) + (plan.remainingMonths || 0), 4);
    const basePaidMonths = plan.paidMonths ?? Math.max(totalTenure - plan.remainingMonths, 0);
    const totalAmount = plan.totalAmount || (monthlyAmount * totalTenure);

    // Projected paid installments at the target month
    let paidMonthsAtTarget: number;
    if (monthOffset >= 0) {
      paidMonthsAtTarget = Math.min(basePaidMonths + monthOffset, totalTenure);
    } else {
      paidMonthsAtTarget = Math.max(basePaidMonths + monthOffset, 0);
    }

    const remainingMonthsAtTarget = Math.max(totalTenure - paidMonthsAtTarget, 0);
    const isSettled = remainingMonthsAtTarget === 0 || plan.status === 'completed';

    // Contract active in target month if there is an installment due in that specific month
    let isActiveInTargetMonth = false;
    let projectedDueInTargetMonth = 0;

    if (monthOffset === 0) {
      // Live current month
      isActiveInTargetMonth = plan.status === 'active' && !plan.isPaidThisMonth && plan.remainingMonths > 0;
      projectedDueInTargetMonth = isActiveInTargetMonth ? monthlyAmount : 0;
    } else if (monthOffset > 0) {
      // Future projection month
      const willBeActive = (basePaidMonths + monthOffset) <= totalTenure && (basePaidMonths + monthOffset) > 0;
      isActiveInTargetMonth = willBeActive && !plan.isPrepaid;
      projectedDueInTargetMonth = isActiveInTargetMonth ? monthlyAmount : 0;
    } else {
      // Historical past month
      isActiveInTargetMonth = paidMonthsAtTarget > 0 && paidMonthsAtTarget <= totalTenure;
      projectedDueInTargetMonth = isActiveInTargetMonth ? monthlyAmount : 0;
    }

    // Cumulative remaining balance to settle after target month
    const remainingDebtAtTarget = Math.round((remainingMonthsAtTarget * monthlyAmount) * 100) / 100;

    // Projected end month
    const startYM = plan.start || baseMonthYear;
    const computedEndYM = plan.end || addMonthsToYearMonth(startYM, totalTenure);

    if (isActiveInTargetMonth) {
      totalUpcomingDues += projectedDueInTargetMonth;
      if (plan.platform === 'Tamara') {
        tamaraUpcomingDues += projectedDueInTargetMonth;
      } else if (plan.platform === 'Tabby') {
        tabbyUpcomingDues += projectedDueInTargetMonth;
      }
    }

    totalRemainingDebt += remainingDebtAtTarget;

    const platform: PlatformType = plan.platform || 'Other';

    return {
      id: plan.id,
      name: plan.name,
      platform,
      monthlyAmount,
      totalAmount,
      tenureMonths: totalTenure,
      paidMonthsAtTarget,
      remainingMonthsAtTarget,
      isActiveInTargetMonth,
      projectedDueInTargetMonth,
      remainingDebtAtTarget,
      startDate: startYM,
      endDate: computedEndYM,
      isSettled,
      isPrepaid: plan.isPrepaid,
      paidExternally: plan.paidExternally,
      lastPaymentMethod: plan.lastPaymentMethod
    };
  });

  const activeInstallmentsCount = schedule.filter(s => s.isActiveInTargetMonth).length;
  const completedInstallmentsCount = schedule.filter(s => s.isSettled).length;

  return {
    targetMonthYear,
    baseMonthYear,
    monthOffset,
    totalUpcomingDues: Math.round(totalUpcomingDues * 100) / 100,
    tamaraUpcomingDues: Math.round(tamaraUpcomingDues * 100) / 100,
    tabbyUpcomingDues: Math.round(tabbyUpcomingDues * 100) / 100,
    activeInstallmentsCount,
    completedInstallmentsCount,
    totalRemainingDebt: Math.round(totalRemainingDebt * 100) / 100,
    installments: schedule
  };
}
