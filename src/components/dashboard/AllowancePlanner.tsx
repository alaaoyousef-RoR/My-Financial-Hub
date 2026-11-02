import React, { useState } from 'react';
import { 
  DynamicAllowanceResult, 
  AllowanceHealthStatus, 
  MultiWeekAllowanceResult, 
  WeeklyAllowanceBreakdown 
} from '../../types/types';
import { useFinancialState } from '../../context/FinancialContext';
import { useMonthContext } from '../../context/MonthContext';
import { formatCurrency, triggerCelebration } from '../../utils/formatters';
import { 
  Wallet, 
  Calendar, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingDown, 
  Clock, 
  ArrowRight, 
  Sparkles,
  Sliders,
  RotateCcw,
  Check,
  CheckCircle2,
  DollarSign,
  Fuel,
  Shield,
  Layers
} from 'lucide-react';

interface AllowancePlannerProps {
  allowance?: DynamicAllowanceResult;
  isReadOnlySimulation?: boolean;
}

export const AllowancePlanner: React.FC<AllowancePlannerProps> = ({
  allowance: propAllowance,
  isReadOnlySimulation = false
}) => {
  const financial = useFinancialState();
  const monthContext = useMonthContext();

  // Multi-week allowance derived for the selected month or current month
  const multiWeek: MultiWeekAllowanceResult = monthContext?.multiWeekAllowance || financial?.multiWeekAllowance;
  
  const {
    targetMonthYear,
    totalCheckingBalance,
    remainingFixedLiabilities,
    unreservedCheckingPool,
    allocatedAllowancePool,
    reservedFunds,
    totalDaysInMonth,
    daysRemainingInMonth,
    numberOfWeeks,
    weeklyAllowance,
    dailyAllowance,
    weeks,
    status,
    burnRateExplanation
  } = multiWeek;

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customInput, setCustomInput] = useState<string>(
    financial.allocatedAllowancePool !== null ? String(financial.allocatedAllowancePool) : ''
  );

  const handleApplyCustomPool = (val: number | null) => {
    financial.setAllocatedAllowancePool(val);
    triggerCelebration();
    setIsCustomizing(false);
    financial.showToast(val === null 
      ? 'تمت إعادة ضبط مخصص المصروف الشخصي إلى التوزيع التلقائي الكامل' 
      : `تم اعتماد مخصص مصروف شخصي شهري بقيمة ${formatCurrency(val)} ر.س وتوزيعه على الأسابيع بنجاح 🎯`
    );
  };

  const handlePercentageQuickSet = (pct: number) => {
    const calculated = Math.round((unreservedCheckingPool * (pct / 100)) * 100) / 100;
    setCustomInput(String(calculated));
    handleApplyCustomPool(calculated);
  };

  const getStatusBadge = (st: AllowanceHealthStatus) => {
    switch (st) {
      case 'HEALTHY':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>سيولة ومصروف متوازن</span>
          </div>
        );
      case 'TIGHT':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>هامش إنفاق مشدود</span>
          </div>
        );
      case 'DEFICIT':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>عجز سيولة مطلوب تغطيته</span>
          </div>
        );
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-6 font-['Readex_Pro',sans-serif]">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-[var(--ink)]">
                مخطط المصروف الأسبوعي المعزول (Decoupled Multi-Week Allowance)
              </h3>
              <span className="text-[10px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono px-2 py-0.5 rounded-full font-bold">
                {targetMonthYear}
              </span>
            </div>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
              عزل المصروف الشخصي عن احتياطيات البنزين والأمانات مع توزيعه بالتساوي على أسابيع الشهر ({numberOfWeeks} أسابيع)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnlySimulation && (
            <button
              type="button"
              onClick={() => setIsCustomizing(prev => !prev)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
              title="تخصيص ميزانية المصروف المعزولة يدوياً"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>{isCustomizing ? 'إغلاق المخصص' : 'تخصيص الميزانية'}</span>
            </button>
          )}
          {getStatusBadge(status)}
        </div>
      </div>

      {/* Interactive Allowance Allocation Control (Custom pool drawer) */}
      {isCustomizing && !isReadOnlySimulation && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-purple-500/40 space-y-3 animate-fadeIn">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[var(--ink)] flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>تحديد مخصص المصروف الشخصي للشهر من الرصيد الجاري:</span>
            </span>
            <span className="text-slate-400">
              الفائض الأقصى المتاح بعد الالتزامات: <strong className="text-emerald-400 font-mono">{formatCurrency(unreservedCheckingPool)} ر.س</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePercentageQuickSet(25)}
              className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 text-slate-300 hover:text-purple-300 transition"
            >
              25% من الفائض
            </button>
            <button
              type="button"
              onClick={() => handlePercentageQuickSet(50)}
              className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 text-slate-300 hover:text-purple-300 transition"
            >
              50% من الفائض
            </button>
            <button
              type="button"
              onClick={() => handlePercentageQuickSet(75)}
              className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 text-slate-300 hover:text-purple-300 transition"
            >
              75% من الفائض
            </button>
            <button
              type="button"
              onClick={() => handlePercentageQuickSet(100)}
              className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 text-slate-300 hover:text-purple-300 transition"
            >
              100% (كامل الفائض)
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomInput('');
                handleApplyCustomPool(null);
              }}
              className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition flex items-center gap-1"
              title="إلغاء التخصيص والعودة للمزامنة التلقائية الكاملة"
            >
              <RotateCcw className="w-3 h-3" />
              <span>تلقائي كامل</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                step="50"
                placeholder="أدخل مبلغ المخصص الشخصي المعتمد..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-mono text-[var(--ink)] focus:outline-none focus:border-purple-500 pl-16 text-right"
              />
              <span className="absolute left-3 top-2.5 text-xs text-[var(--ink-muted)]">ر.س</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const val = parseFloat(customInput);
                if (!isNaN(val) && val >= 0) {
                  handleApplyCustomPool(val);
                }
              }}
              className="btn btn-primary px-4 py-2 text-xs flex items-center gap-1.5 shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>تطبيق المخصص</span>
            </button>
          </div>
        </div>
      )}

      {/* 4-Pill Diversified Liquidity Equation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Step 1: Checking Account Balance */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--ink-muted)]">1. رصيد الحساب الجاري</span>
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-lg font-bold font-mono text-emerald-400 num-ltr mt-1">
            {formatCurrency(totalCheckingBalance)} <small className="text-xs font-sans text-[var(--ink-muted)]">ر.س</small>
          </p>
          <span className="text-[10px] text-slate-500 block mt-0.5">الرصيد الكلي المتاح في البنك</span>
        </div>

        {/* Step 2: Critical Obligations Reserved */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--ink-muted)]">2. التزامات حرجة محجوزة</span>
            <Shield className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="text-lg font-bold font-mono text-rose-400 num-ltr mt-1">
            -{formatCurrency(remainingFixedLiabilities)} <small className="text-xs font-sans text-[var(--ink-muted)]">ر.س</small>
          </p>
          <span className="text-[10px] text-slate-500 block mt-0.5">فواتير + تمويل سيارة + أقساط BNPL</span>
        </div>

        {/* Step 3: Preserved Checking Funds (Fuel / Escrow / Emergency) */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-blue-500/25 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-blue-300">3. أموال محفوظة بالجاري</span>
            <Fuel className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-lg font-bold font-mono text-blue-300 num-ltr mt-1">
            {formatCurrency(reservedFunds.fuelAndEscrowReserve)} <small className="text-xs font-sans text-blue-400">ر.س</small>
          </p>
          <span className="text-[10px] text-blue-400/80 block mt-0.5">محفوظة للبنزين، الأمانات، وحصن الطوارئ</span>
        </div>

        {/* Step 4: Dedicated Allowance Budget */}
        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/40 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-purple-300 font-semibold">4. مخصص المصروف المعتمد</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-lg font-bold font-mono text-purple-200 num-ltr mt-1">
            {formatCurrency(allocatedAllowancePool)} <small className="text-xs font-sans text-purple-300">ر.س</small>
          </p>
          <span className="text-[10px] text-purple-400 block mt-0.5">مخصص موزّع بالتساوي على الأسابيع</span>
        </div>
      </div>

      {/* Multi-Week Calendar Distribution Grid */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs text-[var(--ink-muted)]">
          <span className="font-bold text-[var(--ink)] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>جدول توزيع مخصص المصروف على أسابيع شهر ({targetMonthYear}):</span>
          </span>
          <span className="text-[11px]">
            المخصص الأسبوعي الثابت: <strong className="text-blue-400 font-mono">{formatCurrency(weeklyAllowance)} ر.س / أسبوع</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {weeks.map((w: WeeklyAllowanceBreakdown) => {
            const isCurrent = w.isCurrentWeek;
            const isPast = w.isPastWeek;

            return (
              <div
                key={w.weekNumber}
                className={`p-3.5 rounded-xl border transition-all duration-300 flex flex-col justify-between relative ${
                  isCurrent
                    ? 'bg-purple-950/30 border-purple-500 shadow-md shadow-purple-950/40 ring-1 ring-purple-500/50'
                    : isPast
                      ? 'bg-slate-900/40 border-slate-800 opacity-70'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[var(--ink)] text-xs">{w.name}</span>
                    {isCurrent ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                        النشط حالياً
                      </span>
                    ) : isPast ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        منقضٍ
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        قادم
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-[var(--ink-muted)] font-mono mt-1">
                    {w.startDay} - {w.endDay} ({w.daysCount} أيام)
                  </div>

                  <div className="mt-3 pt-2 border-t border-[var(--glass-border)]">
                    <span className="text-[10px] text-[var(--ink-muted)] block">مخصص الأسبوع:</span>
                    <p className="text-base font-bold font-mono text-[var(--ink)] num-ltr mt-0.5">
                      {formatCurrency(w.allocatedAmount)} <small className="text-[10px] font-sans text-[var(--ink-muted)]">ر.س</small>
                    </p>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-400">
                  <span>سقف اليوم:</span>
                  <span className="font-mono font-bold text-emerald-400 num-ltr">
                    {formatCurrency(w.dailyRate)} ر.س
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contextual Guidance & Burn Rate Protection */}
      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[var(--ink-muted)] flex items-start gap-2.5">
        <ArrowRight className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[var(--ink)]">توجيه التدفق النقدي ومسار الأمان: </strong>
          {burnRateExplanation}
        </p>
      </div>
    </div>
  );
};
