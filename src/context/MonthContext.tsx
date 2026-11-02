import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { MonthItem, MonthContextState, BNPLMonthlySimulation } from '../types/finance';
import { useFinancialState } from './FinancialContext';
import { calculateProjectedMonth } from '../utils/financialMath';
import { simulateBNPLSchedule } from '../utils/financeCalculators';
import { 
  getCurrentYearMonth, 
  generateTimelineMonths, 
  MonthOption 
} from '../utils/dateFilters';

interface ExtendedMonthContextType extends MonthContextState {
  // Monthly isolation & projection values
  activeMonthIncome: number;
  activeMonthFixed: number;
  activeMonthBNPL: number;
  activeMonthTamara: number;
  activeMonthTabby: number;
  activeMonthCar: number;
  activeMonthDiscretionaryNet: number;
  activeMonthCheckingBalance: number;
  activeMonthSavingsBalance: number;
  isZeroDebtMonth: boolean;
  activeInstallmentsCount: number;
  bnplSimulation: BNPLMonthlySimulation;
}

const MonthContext = createContext<ExtendedMonthContextType | undefined>(undefined);

export const MonthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const financial = useFinancialState();
  const currentSystemYM = useMemo(() => getCurrentYearMonth(), []);

  // Dynamically generate rolling timeline: 3 past months, current month (offset 0), +14 future projection months
  const availableMonths: MonthItem[] = useMemo(() => {
    const timeline = generateTimelineMonths(3, 14);
    return timeline.map((m: MonthOption, idx: number) => ({
      id: m.id,
      name: m.name,
      year: m.year,
      monthIndex: idx,
      isCurrentMonth: m.isCurrentMonth,
      isFuture: m.isFuture,
      isPast: m.isPast,
      yearMonth: m.yearMonth,
      monthOffset: m.monthOffset,
      milestoneTag: m.milestoneTag
    }));
  }, [currentSystemYM]);

  // Identify current month index dynamically
  const currentMonthIndex = useMemo(() => {
    const idx = availableMonths.findIndex(m => m.isCurrentMonth);
    return idx >= 0 ? idx : 0;
  }, [availableMonths]);

  // Initialize selectedMonthIndex dynamically to the current system month
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(() => currentMonthIndex);

  const selectedMonth: MonthItem = availableMonths[selectedMonthIndex] || availableMonths[currentMonthIndex] || availableMonths[0];
  const selectedYearMonth = selectedMonth.yearMonth || currentSystemYM;

  // Active live month vs historical/future simulation
  const isReadOnlySimulation = !selectedMonth.isCurrentMonth;

  const goToNextMonth = () => {
    setSelectedMonthIndex(prev => Math.min(prev + 1, availableMonths.length - 1));
  };

  const goToPrevMonth = () => {
    setSelectedMonthIndex(prev => Math.max(prev - 1, 0));
  };

  const goToCurrentMonth = () => {
    setSelectedMonthIndex(currentMonthIndex);
  };

  const selectMonthByIndex = (index: number) => {
    if (index >= 0 && index < availableMonths.length) {
      setSelectedMonthIndex(index);
    }
  };

  const selectMonthByYearMonth = (yearMonth: string) => {
    const foundIdx = availableMonths.findIndex(m => m.yearMonth === yearMonth);
    if (foundIdx >= 0) {
      setSelectedMonthIndex(foundIdx);
    }
  };

  // Projection offset (0 for current and historical months, N > 0 for future forecast)
  const projectionOffset = useMemo(() => {
    return Math.max(selectedMonth.monthOffset ?? 0, 0);
  }, [selectedMonth]);

  // ==========================================
  // DYNAMIC DERIVED PROJECTIONS FOR SELECTED MONTH
  // ==========================================
  const projection = useMemo(() => {
    return calculateProjectedMonth({
      incomes: financial.incomes,
      fixedObligations: financial.fixedObligations,
      carPlan: financial.carPlan,
      installments: financial.installments,
      accountBalances: financial.accountBalances
    }, projectionOffset);
  }, [
    financial.incomes,
    financial.fixedObligations,
    financial.carPlan,
    financial.installments,
    financial.accountBalances,
    projectionOffset
  ]);

  // Multi-month simulated BNPL schedule for selected month
  const bnplSimulation = useMemo(() => {
    return simulateBNPLSchedule(financial.installments, selectedYearMonth, currentSystemYM);
  }, [financial.installments, selectedYearMonth, currentSystemYM]);

  return (
    <MonthContext.Provider
      value={{
        selectedMonth,
        selectedMonthIndex,
        availableMonths,
        isReadOnlySimulation,
        currentYearMonth: currentSystemYM,
        selectedYearMonth,
        goToNextMonth,
        goToPrevMonth,
        goToCurrentMonth,
        selectMonthByIndex,
        selectMonthByYearMonth,

        activeMonthIncome: projection.projectedIncome,
        activeMonthFixed: projection.projectedFixed,
        activeMonthBNPL: projection.projectedBNPL,
        activeMonthTamara: projection.projectedTamara,
        activeMonthTabby: projection.projectedTabby,
        activeMonthCar: projection.projectedCar,
        activeMonthDiscretionaryNet: projection.projectedDiscretionaryNet,
        activeMonthCheckingBalance: projection.projectedCheckingBalance,
        activeMonthSavingsBalance: projection.projectedSavingsBalance,
        isZeroDebtMonth: projection.isZeroDebtMonth,
        activeInstallmentsCount: projection.activeInstallmentsCount,
        bnplSimulation
      }}
    >
      {children}
    </MonthContext.Provider>
  );
};

export const useMonthContext = (): ExtendedMonthContextType => {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error('useMonthContext must be used within a MonthProvider');
  }
  return context;
};
