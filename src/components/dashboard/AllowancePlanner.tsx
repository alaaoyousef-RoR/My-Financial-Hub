import React from 'react';
import { DynamicAllowanceResult, AllowanceHealthStatus } from '../../types/types';
import { formatCurrency } from '../../utils/formatters';
import { 
  Wallet, 
  Calendar, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingDown, 
  Clock, 
  ArrowRight, 
  Sparkles 
} from 'lucide-react';

interface AllowancePlannerProps {
  allowance: DynamicAllowanceResult;
  isReadOnlySimulation?: boolean;
}

export const AllowancePlanner: React.FC<AllowancePlannerProps> = ({
  allowance,
  isReadOnlySimulation = false
}) => {
  const {
    checkingBalance,
    remainingFixedLiabilities,
    availableAllowancePool,
    daysRemainingInMonth,
    dailyAllowance,
    weeklyAllowance,
    status,
    burnRateExplanation
  } = allowance;

  const getStatusBadge = (st: AllowanceHealthStatus) => {
    switch (st) {
      case 'HEALTHY':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>سيولة صحية ومستقرة</span>
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
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-5 font-['Readex_Pro',sans-serif]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-[var(--ink)]">
              مخطط المصروف الشخصي التفاعلي (Dynamic Allowance)
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              محسوب ديناميكياً من رصيد الحساب الجاري بعد حجز جميع الالتزامات الحرجة المتبقية
            </p>
          </div>
        </div>

        {getStatusBadge(status)}
      </div>

      {/* 3-Step Dynamic Equation Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* Step 1: Checking Balance */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 relative">
          <span className="text-[11px] text-[var(--ink-muted)] block">1. رصيد الحساب الجاري المتاح</span>
          <p className="text-lg font-bold font-mono text-emerald-400 num-ltr mt-1">
            {formatCurrency(checkingBalance)} <small className="text-xs font-sans text-[var(--ink-muted)]">ر.س</small>
          </p>
          <span className="text-[10px] text-slate-500">نقطة انطلاق السيولة النقدية</span>
        </div>

        {/* Step 2: Critical Obligations Reserved */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 relative">
          <span className="text-[11px] text-[var(--ink-muted)] block">2. التزامات حرجة متبقية (محجوزة)</span>
          <p className="text-lg font-bold font-mono text-rose-400 num-ltr mt-1">
            -{formatCurrency(remainingFixedLiabilities)} <small className="text-xs font-sans text-[var(--ink-muted)]">ر.س</small>
          </p>
          <span className="text-[10px] text-slate-500">فواتير + سيارة + تمارا/تابي لم تسدد</span>
        </div>

        {/* Step 3: Net Liquid Discretionary Pool */}
        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 relative">
          <span className="text-[11px] text-purple-300 block font-semibold">3. مخصص المصروف الشخصي الصافي</span>
          <p className="text-lg font-bold font-mono text-purple-200 num-ltr mt-1">
            {formatCurrency(availableAllowancePool)} <small className="text-xs font-sans text-purple-300">ر.س</small>
          </p>
          <span className="text-[10px] text-purple-400">سيولة حرة قابلة للإنفاق</span>
        </div>
      </div>

      {/* Daily & Weekly Breakdown Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        {/* Safe Daily Allowance */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/25 flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs text-emerald-300">
            <span>حد الإنفاق اليومي الآمن</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-emerald-400 num-ltr">
              {formatCurrency(dailyAllowance)}
            </span>
            <span className="text-xs text-[var(--ink-muted)] mr-1">ر.س / يومياً</span>
          </div>
          <p className="text-[10px] text-emerald-500/80 mt-1">يحافظ على بقاء رصيدك موجباً حتى نهاية الشهر</p>
        </div>

        {/* Weekly Allowance */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/25 flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs text-blue-300">
            <span>مخصص الأسبوع الحالي</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-blue-400 num-ltr">
              {formatCurrency(weeklyAllowance)}
            </span>
            <span className="text-xs text-[var(--ink-muted)] mr-1">ر.س / أسبوعياً</span>
          </div>
          <p className="text-[10px] text-blue-500/80 mt-1">سقف الإنفاق الأسبوعي المتوازن</p>
        </div>

        {/* Remaining Days in Month */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs text-[var(--ink-muted)]">
            <span>الأيام المتبقية في الشهر</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-amber-400 num-ltr">
              {daysRemainingInMonth}
            </span>
            <span className="text-xs text-[var(--ink-muted)] mr-1">أيام متبقية</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">فترة التوزيع الزمني للمصروف</p>
        </div>
      </div>

      {/* Dynamic Contextual Guidance */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[var(--ink-muted)] flex items-start gap-2.5">
        <ArrowRight className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[var(--ink)]">توجيه التدفق النقدي: </strong>
          {burnRateExplanation}
        </p>
      </div>
    </div>
  );
};
