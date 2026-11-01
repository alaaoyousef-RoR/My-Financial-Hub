import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMonthContext } from '../context/MonthContext';
import { 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Sparkles, 
  Clock, 
  Info,
  ChevronDown,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';

export const MonthSelector: React.FC = () => {
  const {
    selectedMonth,
    selectedMonthIndex,
    availableMonths,
    isReadOnlySimulation,
    goToNextMonth,
    goToPrevMonth,
    goToCurrentMonth,
    selectMonthByIndex,
    isZeroDebtMonth
  } = useMonthContext();

  // Custom Dropdown Open State
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isFirstMonth = selectedMonthIndex === 0;
  const isLastMonth = selectedMonthIndex === availableMonths.length - 1;

  // Group months dynamically by distinct years
  const distinctYears = useMemo<number[]>(() => {
    return Array.from(new Set(availableMonths.map(m => m.year))).sort((a, b) => a - b);
  }, [availableMonths]);

  // Live Calendar Progress
  const now = new Date();
  const currentDayOfMonth = now.getDate();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysUntilReplenishment = Math.max(totalDaysInMonth - currentDayOfMonth, 0);

  return (
    <div className="w-full space-y-2.5 select-none">
      
      {/* Main Bar with Stacking Context */}
      <div className="glass-panel p-3 sm:p-4 rounded-2xl border border-slate-800/90 bg-[rgba(15,23,42,0.7)] flex flex-col md:flex-row items-center justify-between gap-3 shadow-md relative z-30">
        
        {/* Month Title & Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
              !isReadOnlySimulation 
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' 
                : isZeroDebtMonth
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : selectedMonth.isPast
                    ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            }`}>
              <Calendar className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-white">
                  {selectedMonth.name}
                </span>

                {/* Status Badge */}
                {!isReadOnlySimulation ? (
                  <span className="label-mono text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                    <span>الشهر الحالي المباشر</span>
                  </span>
                ) : isZeroDebtMonth ? (
                  <span className="label-mono text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Zero Debt ✨</span>
                  </span>
                ) : selectedMonth.isPast ? (
                  <span className="label-mono text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-400" />
                    <span>أرشيف شهر سابق ({Math.abs(selectedMonth.monthOffset ?? 0)} شهر مضى)</span>
                  </span>
                ) : (
                  <span className="label-mono text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>محاكاة مستقبلية (+{selectedMonth.monthOffset ?? selectedMonthIndex} أشهر)</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[var(--ink-muted)] mt-0.5">
                {!isReadOnlySimulation ? (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-blue-400" />
                    <span>اليوم <strong>{currentDayOfMonth}</strong> من <strong>{totalDaysInMonth}</strong> يوماً · متبقي <strong>{daysUntilReplenishment}</strong> يوماً حتى إيداع الراتب القادم</span>
                  </span>
                ) : selectedMonth.isPast ? (
                  <span>معاينة السجل المالي وسداد الأقساط التاريخية للشهر</span>
                ) : (
                  <span>حساب توقعات الإيرادات وتراجع الأقساط المنتهية تلقائياً</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation & Floating Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end relative" ref={dropdownRef}>
          
          {/* Custom Floating Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(prev => !prev)}
              className="bg-[#09090b] hover:bg-[#131b2e] border border-slate-700/80 hover:border-slate-500 rounded-xl text-xs text-slate-200 px-3 py-1.5 transition flex items-center gap-2 cursor-pointer font-sans shadow-xs"
              aria-haspopup="true"
              aria-expanded={isOpen}
            >
              <span>{selectedMonth.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
            </button>

            {/* Floating Popover Portal Menu */}
            {isOpen && (
              <div 
                className="absolute left-0 top-full mt-2 w-72 bg-[#0c1322] border border-slate-700/90 rounded-2xl shadow-2xl p-2.5 backdrop-blur-2xl z-50 animate-fadeIn"
                style={{ maxHeight: '300px', overflowY: 'auto' }}
              >
                {distinctYears.map((year: number) => {
                  const monthsInYear = availableMonths.filter(m => m.year === year);
                  const isCurrentYear = monthsInYear.some(m => m.isCurrentMonth);

                  return (
                    <div key={year} className="mb-2 last:mb-0">
                      <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                        <span>عام {year} {isCurrentYear ? '(الفترة الحالية)' : ''}</span>
                        {monthsInYear.some(m => m.milestoneTag) && (
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {monthsInYear.map((m) => {
                          const isSelected = m.monthIndex === selectedMonthIndex;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                selectMonthByIndex(m.monthIndex);
                                setIsOpen(false);
                              }}
                              className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                                isSelected 
                                  ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30' 
                                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span>{m.name}</span>
                                {m.isCurrentMonth && (
                                  <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded border border-blue-500/30">
                                    الحالي
                                  </span>
                                )}
                                {m.isPast && (
                                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                                    سابق
                                  </span>
                                )}
                                {m.milestoneTag && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                    {m.milestoneTag.includes('التحرر') ? 'التحرر 🎉' : 'Zero Debt'}
                                  </span>
                                )}
                              </div>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Previous Month */}
          <button
            onClick={goToPrevMonth}
            disabled={isFirstMonth}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition cursor-pointer ${
              isFirstMonth 
                ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-500' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="الشهر السابق"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-semibold">الشهر السابق</span>
          </button>

          {/* Next Month */}
          <button
            onClick={goToNextMonth}
            disabled={isLastMonth}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition cursor-pointer ${
              isLastMonth 
                ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-500' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="الشهر القادم"
          >
            <span className="hidden sm:inline text-xs font-semibold">الشهر القادم</span>
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Jump back to Current Month Button */}
          {isReadOnlySimulation && (
            <button
              onClick={goToCurrentMonth}
              className="btn btn-secondary text-xs px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border-blue-500/40 flex items-center gap-1.5 shadow-xs font-bold"
              title="العودة للشهر الحالي المباشر"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>الشهر الحالي</span>
            </button>
          )}
        </div>
      </div>

      {/* Read-Only Future Simulation Warning Banner */}
      {isReadOnlySimulation && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-200 animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>وضع المحاكاة المستقبلية لشهر {selectedMonth.name} (قراءة فقط):</strong> يتم عرض توقعات الصافي المتاح وانخفاض الأقساط تلقائياً. العمليات البنكية المباشرة مقفلة لحماية رصيدك الجاري الفعلي.
            </span>
          </div>

          <button
            onClick={goToCurrentMonth}
            className="text-[11px] underline text-amber-300 hover:text-white shrink-0 mr-2 cursor-pointer font-bold"
          >
            العودة للمباشر ⚡
          </button>
        </div>
      )}
    </div>
  );
};
