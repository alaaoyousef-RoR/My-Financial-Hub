import React, { useState } from 'react';
import { CarPlan, SettlementMethod } from '../../types/types';
import { formatCurrency, triggerCelebration } from '../../utils/formatters';
import { Car, CheckCircle2, CreditCard, ExternalLink, Zap, ChevronDown } from 'lucide-react';

interface CarLoanWidgetProps {
  carPlan: CarPlan;
  checkingBalance: number;
  onPayCarInstallment: (method: SettlementMethod) => void;
  isReadOnlySimulation?: boolean;
}

export const CarLoanWidget: React.FC<CarLoanWidgetProps> = ({
  carPlan,
  checkingBalance,
  onPayCarInstallment,
  isReadOnlySimulation = false
}) => {
  const [selectedMethod, setSelectedMethod] = useState<SettlementMethod>('CHECKING_ACCOUNT');
  const [showMethodSelector, setShowMethodSelector] = useState(false);

  const carRemaining = Math.max((carPlan.totalInstallments || 0) - (carPlan.paidInstallments || 0), 0);
  const carProgressPct = carPlan.totalInstallments > 0
    ? Math.round(((carPlan.paidInstallments || 0) / carPlan.totalInstallments) * 100)
    : 0;

  const handlePay = (method: SettlementMethod) => {
    onPayCarInstallment(method);
    triggerCelebration();
    setShowMethodSelector(false);
  };

  const getMethodBadge = (method?: SettlementMethod) => {
    switch (method) {
      case 'CHECKING_ACCOUNT':
        return <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">مسدد من الجاري 💳</span>;
      case 'EXTERNAL':
        return <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">مسدد خارجياً 🌐</span>;
      case 'PREPAID':
        return <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">مدفوع مسبقاً ⚡</span>;
      default:
        return null;
    }
  };

  return (
    <div className="glass-panel stat-card p-5 relative overflow-hidden font-['Readex_Pro',sans-serif]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--ink)]">خطة تمويل السيارة</h3>
            <p className="text-[11px] text-[var(--ink-muted)]">إدارة الخصم الآلي والسيولة</p>
          </div>
        </div>
        <span className="label-mono text-[var(--ink-muted)] bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
          <span className="num-ltr font-mono font-bold text-white">{carPlan.paidInstallments}/{carPlan.totalInstallments}</span>
        </span>
      </div>

      {/* Progress Metric */}
      <div className="flex justify-between items-center mt-4 text-xs">
        <span className="text-[var(--ink-muted)]">
          تم سداد <span className="num-ltr font-mono font-bold text-white">{carPlan.paidInstallments}</span> من أصل <span className="num-ltr font-mono font-bold text-white">{carPlan.totalInstallments}</span> قسطاً
        </span>
        <span className="num-ltr font-mono font-bold text-blue-400">{carProgressPct}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden border border-white/5">
        <div
          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-indigo-500"
          style={{ width: `${Math.min(carProgressPct, 100)}%` }}
        />
      </div>

      {/* Financial Details */}
      <div className="mt-4 pt-3 border-t border-[var(--glass-border)] text-xs space-y-2">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-[var(--ink-muted)]">قيمة القسط الشهري:</span>
          <span className="num-ltr font-mono font-bold text-white">
            {formatCurrency(carPlan.monthlyInstallment)} ر.س
          </span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-[var(--ink-muted)]">الأقساط المتبقية:</span>
          <span className="font-mono text-amber-400 font-bold"><span className="num-ltr">{carRemaining}</span> شهراً</span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-[var(--ink-muted)]">الدفعة الأخيرة (المؤجلة):</span>
          <span className="num-ltr font-mono font-bold text-amber-400">{formatCurrency(carPlan.balloonPayment)} ر.س</span>
        </div>
        {carPlan.isPaidThisMonth && (
          <div className="flex justify-between items-center text-[11px] pt-1">
            <span className="text-[var(--ink-muted)]">حالة قسط هذا الشهر:</span>
            {getMethodBadge(carPlan.lastPaymentMethod)}
          </div>
        )}
      </div>

      {/* Settlement Action Bar */}
      {carRemaining > 0 && !isReadOnlySimulation && !carPlan.isPaidThisMonth && (
        <div className="mt-4 pt-3 border-t border-[var(--glass-border)]">
          {!showMethodSelector ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePay('CHECKING_ACCOUNT')}
                className="btn btn-primary flex-1 text-xs py-2 flex items-center justify-center gap-1.5 shadow-sm"
                title="خصم مباشر من الحساب الجاري"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>سداد وخصم من الجاري ({formatCurrency(carPlan.monthlyInstallment)} ر.س)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMethodSelector(true)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--ink-muted)] hover:text-white transition"
                title="خيارات سداد أخرى (خارجي أو مسبق)"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-white/10 animate-fadeIn">
              <p className="text-[11px] font-bold text-[var(--ink)] mb-2">اختر طريقة تسوية القسط:</p>
              
              <button
                type="button"
                onClick={() => handlePay('CHECKING_ACCOUNT')}
                className="w-full text-right p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>خصم من الحساب الجاري</span>
                </div>
                <span className="text-[10px] text-emerald-400">يخصم من الرصيد</span>
              </button>

              <button
                type="button"
                onClick={() => handlePay('EXTERNAL')}
                className="w-full text-right p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>سداد من حساب خارجي</span>
                </div>
                <span className="text-[10px] text-blue-400">لا يمس الرصيد الجاري</span>
              </button>

              <button
                type="button"
                onClick={() => handlePay('PREPAID')}
                className="w-full text-right p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  <span>تسوية مسبقة (مدفوع مقدماً)</span>
                </div>
                <span className="text-[10px] text-purple-400">لا يمس الرصيد الجاري</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMethodSelector(false)}
                className="w-full text-center text-[10px] text-[var(--ink-muted)] hover:text-white py-1"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      )}

      {carPlan.isPaidThisMonth && (
        <div className="mt-3.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>تم سداد قسط هذا الشهر بنجاح 🎉</span>
        </div>
      )}
    </div>
  );
};
