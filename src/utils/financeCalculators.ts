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
  InstallmentItemStatus,
  InstallmentScheduleItem,
  InstallmentPlan,
  CarPlan,
  FixedObligation,
  BNPLMonthlySimulation,
  SimulatedInstallmentItem,
  DynamicAllowanceResult,
  AllowanceHealthStatus,
  PlatformType,
  WeeklyAllowanceBreakdown,
  MultiWeekAllowanceResult
} from '../types/types';
import {
  getCurrentYearMonth,
  getMonthOffset,
  addMonthsToYearMonth,
  parseYearMonth,
  getDaysInMonth,
  getRemainingDaysInMonth
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
 * 2. Generate Calendar-Tied Installment Schedule
 * Creates a deterministic, explicit ledger of monthly installments for a contract.
 * Ties each installment to a specific target calendar month (YYYY-MM).
 */
export function generateInstallmentSchedule(
  plan: InstallmentPlan,
  baseMonthYear: string = getCurrentYearMonth()
): InstallmentScheduleItem[] {
  if (Array.isArray(plan.schedule) && plan.schedule.length > 0) {
    return [...plan.schedule].sort((a, b) => a.monthYear.localeCompare(b.monthYear));
  }

  const monthlyAmount = Math.max(Number(plan.amount) || 0, 0);
  const totalTenure = plan.totalMonths || Math.max((plan.paidMonths || 0) + (plan.remainingMonths || 0), 4);
  const startYM = plan.start || baseMonthYear;
  const basePaidMonths = plan.paidMonths ?? Math.max(totalTenure - plan.remainingMonths, 0);

  const items: InstallmentScheduleItem[] = [];

  for (let i = 0; i < totalTenure; i++) {
    const itemMonthYear = addMonthsToYearMonth(startYM, i);
    const installmentNumber = i + 1;
    let status: InstallmentItemStatus = 'DUE';
    let paymentMethod: SettlementMethod | undefined = undefined;

    if (itemMonthYear < baseMonthYear) {
      // Historical past month
      if (i < basePaidMonths) {
        status = 'PAID_ON_SCHEDULE';
      } else {
        status = 'SKIPPED';
      }
    } else if (itemMonthYear === baseMonthYear) {
      // Active current month
      if (plan.isPaidThisMonth) {
        if (plan.isPrepaid) {
          status = 'PAID_IN_ADVANCE';
          paymentMethod = 'PREPAID';
        } else if (plan.paidExternally) {
          status = 'EXTERNAL';
          paymentMethod = 'EXTERNAL';
        } else {
          status = 'PAID_ON_SCHEDULE';
          paymentMethod = plan.lastPaymentMethod || plan.paymentMethod || 'CHECKING_ACCOUNT';
        }
      } else {
        status = 'DUE';
      }
    } else {
      // Future month
      if (plan.isPrepaid) {
        status = 'PAID_IN_ADVANCE';
        paymentMethod = 'PREPAID';
      } else if (plan.status === 'completed' || plan.remainingMonths === 0) {
        status = 'PAID_IN_ADVANCE';
      } else {
        status = 'DUE';
      }
    }

    items.push({
      id: `${plan.id}-sch-${itemMonthYear}`,
      monthYear: itemMonthYear,
      installmentNumber,
      amount: monthlyAmount,
      status,
      paymentMethod,
      dueDate: `${itemMonthYear}-${String(plan.dueDay || 15).padStart(2, '0')}`
    });
  }

  return items;
}

/**
 * 3. Decoupled Multi-Week Allowance Calculator
 * Decouples the allowance budget from rigid total checking balance.
 * Protects preserved checking funds (fuel, escrow, emergency cash).
 * Evenly distributes the dedicated allowance budget across weeks 1 to 4/5 of the month.
 */
export function calculateMultiWeekAllowance(
  allocatedAllowancePool: number | null,
  checkingBalance: number,
  remainingFixedLiabilities: number,
  targetMonthYear: string = getCurrentYearMonth(),
  referenceDate: Date = new Date()
): MultiWeekAllowanceResult {
  const currentYM = getCurrentYearMonth(referenceDate);
  const totalDays = getDaysInMonth(targetMonthYear);
  const remainingDays = getRemainingDaysInMonth(targetMonthYear, referenceDate);

  const balance = Math.max(Number(checkingBalance) || 0, 0);
  const liabilities = Math.max(Number(remainingFixedLiabilities) || 0, 0);
  const unreservedCheckingPool = Math.max(Math.round((balance - liabilities) * 100) / 100, 0);

  // User explicitly allocates a dedicated allowance pool, or it defaults to unreserved checking
  let pool: number;
  if (allocatedAllowancePool !== null && !isNaN(allocatedAllowancePool) && allocatedAllowancePool >= 0) {
    pool = Math.round(allocatedAllowancePool * 100) / 100;
  } else {
    pool = unreservedCheckingPool;
  }

  // Funds preserved in checking for fuel, escrow, emergency buffer
  const fuelAndEscrowReserve = Math.max(Math.round((balance - liabilities - pool) * 100) / 100, 0);

  // Define calendar week partitions (standard 4 to 5 weeks)
  const rawWeeks = [
    { weekNumber: 1, name: 'الأسبوع الأول', startDay: 1, endDay: 7 },
    { weekNumber: 2, name: 'الأسبوع الثاني', startDay: 8, endDay: 14 },
    { weekNumber: 3, name: 'الأسبوع الثالث', startDay: 15, endDay: 21 },
    { weekNumber: 4, name: 'الأسبوع الرابع', startDay: 22, endDay: 28 },
    ...(totalDays > 28 ? [{ weekNumber: 5, name: 'الأسبوع الخامس (الختام)', startDay: 29, endDay: totalDays }] : [])
  ];

  const numberOfWeeks = rawWeeks.length;
  const weeklyAllowance = Math.round((pool / (numberOfWeeks > 0 ? numberOfWeeks : 1)) * 100) / 100;
  const dailyAllowance = Math.round((pool / (totalDays > 0 ? totalDays : 1)) * 100) / 100;

  const currentDay = targetMonthYear === currentYM 
    ? referenceDate.getDate() 
    : (targetMonthYear < currentYM ? totalDays : 1);

  const weeks: WeeklyAllowanceBreakdown[] = rawWeeks.map(w => {
    const daysCount = w.endDay - w.startDay + 1;
    const isCurrentWeek = targetMonthYear === currentYM && currentDay >= w.startDay && currentDay <= w.endDay;
    const isPastWeek = targetMonthYear < currentYM || (targetMonthYear === currentYM && currentDay > w.endDay);
    const isFutureWeek = targetMonthYear > currentYM || (targetMonthYear === currentYM && currentDay < w.startDay);

    const pad2 = (n: number) => String(n).padStart(2, '0');
    const startDate = `${targetMonthYear}-${pad2(w.startDay)}`;
    const endDate = `${targetMonthYear}-${pad2(w.endDay)}`;

    return {
      weekNumber: w.weekNumber,
      name: w.name,
      startDate,
      endDate,
      startDay: w.startDay,
      endDay: w.endDay,
      daysCount,
      allocatedAmount: weeklyAllowance,
      dailyRate: Math.round((weeklyAllowance / daysCount) * 100) / 100,
      isCurrentWeek,
      isPastWeek,
      isFutureWeek
    };
  });

  // Health and burn rate explanation
  let status: AllowanceHealthStatus = 'HEALTHY';
  let burnRateExplanation = 'تم عزل مخصص المصروف الشخصي المعتمد عن أموال البنزين والأمانات وتوزيعه بالتساوي على أسابيع الشهر.';

  if (balance < liabilities) {
    status = 'DEFICIT';
    const deficit = (liabilities - balance).toFixed(2);
    burnRateExplanation = `تنبيه: عجز سيولة بقيمة (${deficit} ر.س) لتغطية الالتزامات الحرجة المحجوزة. يجب تعليق أي سحوبات للمصروف الشخصي.`;
  } else if (pool > unreservedCheckingPool) {
    status = 'TIGHT';
    burnRateExplanation = `تنبيه: مخصص المصروف المعتمد (${pool.toFixed(2)} ر.س) يتجاوز الفائض المتاح بعد الالتزامات (${unreservedCheckingPool.toFixed(2)} ر.س). تم تفعيل وضع التنبيه.`;
  } else if (dailyAllowance < 60 || pool < 500) {
    status = 'TIGHT';
    burnRateExplanation = 'هامش المصروف الأسبوعي مقيد. يرجى الالتزام بمعدل الصرف الأسبوعي لتفادي الضغط على السيولة.';
  }

  return {
    targetMonthYear,
    totalCheckingBalance: balance,
    remainingFixedLiabilities: liabilities,
    unreservedCheckingPool,
    allocatedAllowancePool: pool,
    reservedFunds: {
      criticalObligations: liabilities,
      fuelAndEscrowReserve
    },
    totalDaysInMonth: totalDays,
    daysRemainingInMonth: remainingDays,
    numberOfWeeks,
    weeklyAllowance,
    dailyAllowance,
    weeks,
    status,
    burnRateExplanation
  };
}

/**
 * 4. Calculate Dynamic Allowance (Backward compatible wrapper)
 */
export function calculateDynamicAllowance(
  checkingBalance: number,
  remainingFixedLiabilities: number,
  daysRemainingInMonth: number,
  customAllocatedPool?: number | null
): DynamicAllowanceResult {
  const balance = Math.max(Number(checkingBalance) || 0, 0);
  const liabilities = Math.max(Number(remainingFixedLiabilities) || 0, 0);

  const availableAllowancePool = customAllocatedPool !== undefined && customAllocatedPool !== null
    ? Math.max(Number(customAllocatedPool) || 0, 0)
    : Math.max(Math.round((balance - liabilities) * 100) / 100, 0);

  const safeDays = Math.max(Math.floor(daysRemainingInMonth), 0);
  const daysDenominator = safeDays > 0 ? safeDays : 1;

  const dailyAllowance = Math.round((availableAllowancePool / daysDenominator) * 100) / 100;
  const weeklyAllowance = Math.round((dailyAllowance * 7) * 100) / 100;

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
 * 5. Simulate BNPL Schedule (Tabby & Tamara) with Explicit Ledger Support
 * An installment contributes to upcoming dues for targetMonthYear IF AND ONLY IF
 * its status in the explicit calendar ledger is 'DUE'.
 * Unpaid items, prepaid, external, or skipped items are reflected deterministically.
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
    const planSchedule = generateInstallmentSchedule(plan, baseMonthYear);
    const totalTenure = planSchedule.length || plan.totalMonths || Math.max((plan.paidMonths || 0) + (plan.remainingMonths || 0), 4);
    const totalAmount = plan.totalAmount || (monthlyAmount * totalTenure);

    // Find schedule item matching targetMonthYear
    const targetScheduleItem = planSchedule.find(item => item.monthYear === targetMonthYear);

    // Explicit check: An installment contributes to upcoming dues for targetMonthYear IF AND ONLY IF status === 'DUE'
    const targetMonthStatus: InstallmentItemStatus = targetScheduleItem 
      ? targetScheduleItem.status 
      : (targetMonthYear < (plan.start || baseMonthYear) ? 'SKIPPED' : 'PAID_ON_SCHEDULE');

    const isActiveInTargetMonth = targetScheduleItem?.status === 'DUE';
    const projectedDueInTargetMonth = isActiveInTargetMonth ? (targetScheduleItem?.amount ?? monthlyAmount) : 0;

    // Remaining debt at target: Sum of all DUE installments in schedule from targetMonthYear onwards
    const remainingDueItems = planSchedule.filter(item => item.status === 'DUE' && item.monthYear >= targetMonthYear);
    const remainingDebtAtTarget = Math.round(
      remainingDueItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) * 100
    ) / 100;

    // Count paid up to target month
    const paidMonthsAtTarget = planSchedule.filter(
      item => item.monthYear <= targetMonthYear && (item.status === 'PAID_ON_SCHEDULE' || item.status === 'PAID_IN_ADVANCE' || item.status === 'EXTERNAL')
    ).length;

    const remainingMonthsAtTarget = remainingDueItems.length;
    const isSettled = remainingMonthsAtTarget === 0;

    const startYM = plan.start || (planSchedule[0] ? planSchedule[0].monthYear : baseMonthYear);
    const computedEndYM = plan.end || (planSchedule.length > 0 ? planSchedule[planSchedule.length - 1].monthYear : addMonthsToYearMonth(startYM, totalTenure));

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
      isPrepaid: plan.isPrepaid || targetMonthStatus === 'PAID_IN_ADVANCE',
      paidExternally: plan.paidExternally || targetMonthStatus === 'EXTERNAL',
      lastPaymentMethod: targetScheduleItem?.paymentMethod || plan.lastPaymentMethod,
      targetMonthStatus,
      targetScheduleItem,
      schedule: planSchedule
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
