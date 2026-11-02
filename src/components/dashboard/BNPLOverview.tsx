import React, { useState } from 'react';
import { BNPLMonthlySimulation, SettlementMethod, SimulatedInstallmentItem } from '../../types/types';
import { formatCurrency, triggerCelebration } from '../../utils/formatters';
import { 
  Layers, 
  CreditCard, 
  ExternalLink, 
  Zap, 
  CheckCircle2, 
  Calendar, 
  RotateCcw, 
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface BNPLOverviewProps {
  simulation: BNPLMonthlySimulation;
  isCurrentMonth: boolean;
  onPayInstallment: (id: string, method: SettlementMethod) => void;
  onUndoPayInstallment?: (id: string) => void;
  isReadOnlySimulation?: boolean;
}

export const BNPLOverview: React.FC<BNPLOverviewProps> = ({
  simulation,
  isCurrentMonth,
  onPayInstallment,
  onUndoPayInstallment,
  isReadOnlySimulation = false
}) => {
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const {
    targetMonthYear,
    monthOffset,
    totalUpcomingDues,
    tamaraUpcomingDues,
    tabbyUpcomingDues,
    activeInstallmentsCount,
    completedInstallmentsCount,
    totalRemainingDebt,
    installments
  } = simulation;

  const handlePay = (id: string, method: SettlementMethod) => {
    onPayInstallment(id, method);
    triggerCelebration();
    setActiveActionId(null);
  };

  return (
    <div className="space-y-6 font-['Readex_Pro',sans-serif]">
      {/* 4 Summary Cards for Target Month */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Upcoming Dues */}
        <div className="glass-panel p-4 flex items-center justify-between border-rose-500/35 hover:border-[var(--danger)] transition">
          <div>
            <span className="label-mono font-bold text-rose-400">
              {monthOffset === 0 ? 'إجمالي أقساط هذا الشهر' : `أقساط شهر (${targetMonthYear})`}
            </span>
            <p className="text-xl font-bold font-mono text-[var(--danger)] num-ltr mt-1">
              {formatCurrency(totalUpcomingDues)} <small className="text-xs text-[var(--ink-muted)] font-sans">ر.س</small>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Tamara Dues */}
        <div className="glass-panel border-rose-500/30 p-4 flex items-center justify-between">
          <div>
            <span className="label-mono font-bold text-rose-300">أقساط تمارا (Tamara)</span>
            <p className="text-xl font-bold font-mono text-rose-300 num-ltr mt-1">
              {formatCurrency(tamaraUpcomingDues)} <small className="text-xs text-[var(--ink-muted)] font-sans">ر.س</small>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
            TMR
          </div>
        </div>

        {/* Tabby Dues */}
        <div className="glass-panel border-emerald-500/30 p-4 flex items-center justify-between">
          <div>
            <span className="label-mono font-bold text-emerald-400">أقساط تابي (Tabby)</span>
            <p className="text-xl font-bold font-mono text-emerald-400 num-ltr mt-1">
              {formatCurrency(tabbyUpcomingDues)} <small className="text-xs text-[var(--ink-muted)] font-sans">ر.س</small>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            TAB
          </div>
        </div>

        {/* Total Cumulative Remaining Debt */}
        <div className="glass-panel border-blue-500/30 p-4 flex items-center justify-between">
          <div>
            <span className="label-mono font-bold text-blue-400">إجمالي المديونية المتبقية</span>
            <p className="text-xl font-bold font-mono text-blue-400 num-ltr mt-1">
              {formatCurrency(totalRemainingDebt)} <small className="text-xs text-[var(--ink-muted)] font-sans">ر.س</small>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Multi-Month Simulation Banner if not current month */}
      {!isCurrentMonth && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              أنت تستعرض محاكاة الأقساط لشهر مستقبلي ({targetMonthYear}). يتم تحديث استحقاق العقود والأقساط وتواريخ الانتهاء تلقائياً بناءً على مدة كل عقد.
            </span>
          </div>
          <span className="font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30 text-[11px]">
            الإزاحة: +{monthOffset} شهر
          </span>
        </div>
      )}

      {/* Simulated Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {installments.map((item: SimulatedInstallmentItem) => {
          const isTamara = item.platform === 'Tamara';
          const platformColor = isTamara ? 'rose' : 'emerald';
          const isCompleted = item.isSettled || item.remainingMonthsAtTarget === 0;

          return (
            <div
              key={item.id}
              className={`glass-panel p-4 rounded-xl border transition-all duration-300 relative flex flex-col justify-between ${
                isCompleted 
                  ? 'border-emerald-500/20 bg-emerald-950/10 opacity-75' 
                  : isTamara 
                    ? 'border-rose-500/30 hover:border-rose-500/50' 
                    : 'border-emerald-500/30 hover:border-emerald-500/50'
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isTamara 
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' 
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    }`}>
                      {item.platform}
                    </span>
                    <h4 className="font-bold text-sm text-[var(--ink)] mt-1.5">{item.name}</h4>
                  </div>

                  <span className="font-mono text-xs text-[var(--ink-muted)] bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {item.paidMonthsAtTarget}/{item.tenureMonths} قسط
                  </span>
                </div>

                {/* Amount & Remaining */}
                <div className="flex justify-between items-baseline mt-3">
                  <div>
                    <span className="text-[10px] text-[var(--ink-muted)]">القسط الشهري:</span>
                    <p className="text-base font-bold font-mono text-[var(--ink)] num-ltr">
                      {formatCurrency(item.monthlyAmount)} <small className="text-[10px] text-[var(--ink-muted)] font-sans">ر.س</small>
                    </p>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-[var(--ink-muted)]">المتبقي الإجمالي:</span>
                    <p className="text-sm font-bold font-mono text-amber-400 num-ltr">
                      {formatCurrency(item.remainingDebtAtTarget)} <small className="text-[10px] font-sans">ر.س</small>
                    </p>
                  </div>
                </div>

                {/* Tenure Progress Bar */}
                <div className="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTamara ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        item.tenureMonths > 0 
                          ? Math.round((item.paidMonthsAtTarget / item.tenureMonths) * 100) 
                          : 0, 
                        100
                      )}%`
                    }}
                  />
                </div>

                {/* End Date Information */}
                <div className="mt-3 pt-2.5 border-t border-[var(--glass-border)] flex justify-between items-center text-[11px] text-[var(--ink-muted)]">
                  <span>تاريخ الانتهاء المقدر:</span>
                  <span className="font-mono font-bold text-slate-300">{item.endDate}</span>
                </div>
              </div>

              {/* Action Section for Active Month */}
              <div className="mt-4 pt-3 border-t border-[var(--glass-border)]">
                {isCurrentMonth && !isReadOnlySimulation && !isCompleted ? (
                  activeActionId !== item.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePay(item.id, 'CHECKING_ACCOUNT')}
                        className="btn btn-primary flex-1 text-xs py-1.5 flex items-center justify-center gap-1 shadow-sm"
                        title="سداد القسط وخصمه من الحساب الجاري"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>سداد من الجاري</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveActionId(item.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--ink-muted)] hover:text-white transition"
                        title="خيارات تسوية أخرى (خارجي أو سداد مسبق)"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 bg-slate-900/80 p-2.5 rounded-xl border border-white/10 text-xs animate-fadeIn">
                      <p className="text-[10px] font-bold text-[var(--ink)] mb-1">اختر طريقة السداد:</p>
                      
                      <button
                        type="button"
                        onClick={() => handlePay(item.id, 'CHECKING_ACCOUNT')}
                        className="w-full text-right p-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] flex items-center justify-between transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-3 h-3" />
                          <span>الحساب الجاري</span>
                        </span>
                        <span className="text-[9px] text-emerald-400">يخصم من الرصيد</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePay(item.id, 'EXTERNAL')}
                        className="w-full text-right p-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[11px] flex items-center justify-between transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <ExternalLink className="w-3 h-3" />
                          <span>سداد خارجي</span>
                        </span>
                        <span className="text-[9px] text-blue-400">بدون خصم الجاري</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePay(item.id, 'PREPAID')}
                        className="w-full text-right p-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[11px] flex items-center justify-between transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3" />
                          <span>تسوية مسبقة</span>
                        </span>
                        <span className="text-[9px] text-purple-400">مدفوع مقدماً</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveActionId(null)}
                        className="w-full text-center text-[10px] text-[var(--ink-muted)] hover:text-white pt-1"
                      >
                        إلغاء
                      </button>
                    </div>
                  )
                ) : isCompleted ? (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold py-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>مكتمل بالكامل 🎉</span>
                  </div>
                ) : (
                  <div className="text-center text-[11px] text-[var(--ink-muted)] py-1">
                    {item.isActiveInTargetMonth ? 'مستحق في هذا الشهر' : 'غير مستحق في هذا الشهر'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
