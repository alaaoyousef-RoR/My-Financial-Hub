/**
 * Pure Date Filtering and Month-Agnostic Utilities
 * Provides deterministic date parsing, ISO month extraction, month filtering,
 * rolling timeline generation, and financial aggregations without any hardcoded dates.
 */

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  yearMonth: string; // "YYYY-MM"
}

export interface DateFilterOptions {
  yearMonth: string; // Target "YYYY-MM"
  startDate?: string;
  endDate?: string;
  includeFuture?: boolean;
}

export interface MonthOption {
  id: string; // e.g. "m-2026-11"
  yearMonth: string; // "2026-11"
  year: number;
  monthIndex: number; // 0-based offset in timeline
  monthNumber: number; // 1-12
  name: string; // e.g. "نوفمبر 2026"
  isCurrentMonth: boolean;
  isPast: boolean;
  isFuture: boolean;
  monthOffset: number; // 0 = current, < 0 = past, > 0 = future
  milestoneTag?: string;
}

export interface MonthSummaryAggregate {
  yearMonth: string;
  monthLabel: string;
  totalExpenses: number;
  totalTopUps: number;
  netExpenses: number;
  transactionCount: number;
  dailyAverage: number;
  daysInMonth: number;
}

/**
 * Returns the current year-month string in "YYYY-MM" format using system clock or reference date.
 * Strictly dynamic and month-agnostic.
 */
export function getCurrentYearMonth(referenceDate: Date | string = new Date()): string {
  const d = typeof referenceDate === 'string' ? new Date(referenceDate) : referenceDate;
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Parses a "YYYY-MM" string into numeric year and month (1-12).
 */
export function parseYearMonth(yearMonthStr: string): { year: number; month: number } {
  if (!yearMonthStr || typeof yearMonthStr !== 'string') {
    const current = new Date();
    return { year: current.getFullYear(), month: current.getMonth() + 1 };
  }
  const parts = yearMonthStr.split('-');
  if (parts.length >= 2) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
      return { year: y, month: m };
    }
  }
  const current = new Date();
  return { year: current.getFullYear(), month: current.getMonth() + 1 };
}

/**
 * Extracts "YYYY-MM" safely from any ISO date string or date value.
 * Handles "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ssZ", etc.
 */
export function extractYearMonthFromDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return getCurrentYearMonth();
  }
  // Try fast regex match for YYYY-MM
  const match = dateStr.match(/^(\d{4})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  return getCurrentYearMonth();
}

/**
 * Formats a "YYYY-MM" string into localized Arabic month name and year (e.g. "نوفمبر 2026").
 */
export function formatMonthLabel(yearMonthStr: string, locale: string = 'ar-SA'): string {
  const { year, month } = parseYearMonth(yearMonthStr);
  try {
    // Construct UTC-safe date for the 15th of the month to prevent timezone drift
    const date = new Date(year, month - 1, 15);
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
  } catch {
    return `${month}/${year}`;
  }
}

/**
 * Returns the total number of days in a given "YYYY-MM" month (handles leap years).
 */
export function getDaysInMonth(yearMonthStr: string): number {
  const { year, month } = parseYearMonth(yearMonthStr);
  // Passing 0 as day gets the last day of previous month; month parameter is 1-indexed here
  return new Date(year, month, 0).getDate();
}

/**
 * Calculates remaining days in month relative to a reference day or system date.
 */
export function getRemainingDaysInMonth(yearMonthStr: string, referenceDate: Date = new Date()): number {
  const currentYM = getCurrentYearMonth(referenceDate);
  const totalDays = getDaysInMonth(yearMonthStr);
  
  if (yearMonthStr < currentYM) {
    return 0; // Past month
  }
  if (yearMonthStr > currentYM) {
    return totalDays; // Future month has all days remaining
  }
  const currentDay = referenceDate.getDate();
  return Math.max(totalDays - currentDay + 1, 1);
}

/**
 * Computes month offset between target "YYYY-MM" and base "YYYY-MM".
 * Returns 0 for same month, positive for future, negative for past.
 */
export function getMonthOffset(targetYearMonth: string, baseYearMonth: string = getCurrentYearMonth()): number {
  const target = parseYearMonth(targetYearMonth);
  const base = parseYearMonth(baseYearMonth);
  return (target.year - base.year) * 12 + (target.month - base.month);
}

/**
 * Adds or subtracts months from a "YYYY-MM" string and returns the resulting "YYYY-MM".
 */
export function addMonthsToYearMonth(yearMonthStr: string, monthDelta: number): string {
  const { year, month } = parseYearMonth(yearMonthStr);
  const targetDate = new Date(year, month - 1 + monthDelta, 1);
  const newYear = targetDate.getFullYear();
  const newMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
  return `${newYear}-${newMonth}`;
}

/**
 * Pure predicate checking if an item's date belongs to the specified target "YYYY-MM".
 */
export function isDateInMonth(dateStr: string, targetYearMonth: string): boolean {
  if (!dateStr || !targetYearMonth) return false;
  return extractYearMonthFromDate(dateStr) === targetYearMonth;
}

/**
 * Filters a generic array of items containing a `date` field by target "YYYY-MM".
 */
export function filterByMonth<T extends { date: string }>(items: T[], targetYearMonth: string): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter(item => isDateInMonth(item.date, targetYearMonth));
}

/**
 * Extracts a deduplicated, chronologically sorted array of all unique "YYYY-MM" strings from records.
 */
export function extractDistinctMonthsFromRecords<T extends { date: string }>(records: T[]): string[] {
  if (!Array.isArray(records)) return [];
  const set = new Set<string>();
  for (const r of records) {
    if (r && r.date) {
      set.add(extractYearMonthFromDate(r.date));
    }
  }
  return Array.from(set).sort();
}

/**
 * Dynamically generates a rolling timeline of MonthOption objects.
 * Centered around current system month without hardcoded start dates.
 *
 * @param pastMonthsCount Number of historical past months to include (default: 3)
 * @param futureMonthsCount Number of future simulation months to include (default: 14)
 * @param referenceDate Reference anchor date (default: system current date)
 */
export function generateTimelineMonths(
  pastMonthsCount: number = 3,
  futureMonthsCount: number = 14,
  referenceDate: Date = new Date()
): MonthOption[] {
  const currentYM = getCurrentYearMonth(referenceDate);
  const options: MonthOption[] = [];

  const startOffset = -Math.max(pastMonthsCount, 0);
  const endOffset = Math.max(futureMonthsCount, 0);

  let sequenceIndex = 0;
  for (let offset = startOffset; offset <= endOffset; offset++) {
    const targetYM = addMonthsToYearMonth(currentYM, offset);
    const { year, month } = parseYearMonth(targetYM);
    const isCurrent = offset === 0;
    const isPast = offset < 0;
    const isFuture = offset > 0;

    let milestoneTag: string | undefined = undefined;
    if (offset === 5) {
      milestoneTag = 'التحرر الكامل من الأقساط 🎉';
    } else if (offset === 6) {
      milestoneTag = 'Zero Debt 🚀';
    }

    options.push({
      id: `m-${targetYM}`,
      yearMonth: targetYM,
      year,
      monthIndex: sequenceIndex,
      monthNumber: month,
      name: formatMonthLabel(targetYM),
      isCurrentMonth: isCurrent,
      isPast,
      isFuture,
      monthOffset: offset,
      milestoneTag
    });
    sequenceIndex++;
  }

  return options;
}

/**
 * Aggregates monthly expense records for a specific "YYYY-MM".
 * Distinguishes genuine expenses from top-ups without metric corruption.
 */
export function aggregateMonthlyExpenses<T extends { amount: number; date: string; type?: string; category?: string }>(
  items: T[],
  targetYearMonth: string
): MonthSummaryAggregate {
  const monthItems = filterByMonth(items, targetYearMonth);
  const daysInMonth = getDaysInMonth(targetYearMonth);

  let totalExpenses = 0;
  let totalTopUps = 0;

  for (const item of monthItems) {
    const isTopUp = item.type === 'TOP_UP' || item.category === 'تغذية مخصص' || item.amount < 0;
    if (isTopUp) {
      totalTopUps += Math.abs(Number(item.amount) || 0);
    } else if (item.amount > 0) {
      totalExpenses += Number(item.amount) || 0;
    }
  }

  const roundedExp = Math.round(totalExpenses * 100) / 100;
  const roundedTop = Math.round(totalTopUps * 100) / 100;
  const netExpenses = Math.round((roundedExp - roundedTop) * 100) / 100;
  const dailyAverage = daysInMonth > 0 ? Math.round((roundedExp / daysInMonth) * 100) / 100 : 0;

  return {
    yearMonth: targetYearMonth,
    monthLabel: formatMonthLabel(targetYearMonth),
    totalExpenses: roundedExp,
    totalTopUps: roundedTop,
    netExpenses,
    transactionCount: monthItems.length,
    dailyAverage,
    daysInMonth
  };
}
