import React, { useState } from 'react';
import { formatCurrency, triggerCelebration } from '../utils/formatters';
import { 
  calculateNetRealLiquidity, 
  calculateTotalLiquidNetWorth 
} from '../utils/financialMath';
import { 
  Landmark, 
  Wallet, 
  PiggyBank, 
  Eye, 
  EyeOff, 
  Edit2, 
  Check, 
  X, 
  ShieldCheck, 
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';

export interface AccountBalancesProps {
  checkingBalance: number;
  savingsBalance: number;
  unpaidCommitments: number; // monthly fixed + active BNPL installments
  emergencyTarget?: number;
  onUpdateBalances: (checking: number, savings: number) => void;
  onOpenSavingsModal?: () => void;
  isReadOnlySimulation?: boolean;
}

export const AccountBalances: React.FC<AccountBalancesProps> = ({
  checkingBalance,
  savingsBalance,
  unpaidCommitments,
  emergencyTarget = 30000,
  onUpdateBalances,
  onOpenSavingsModal,
  isReadOnlySimulation = false
}) => {
  // Privacy mask state
  const [isMasked, setIsMasked] = useState<boolean>(() => {
    return localStorage.getItem('balances_privacy_masked') === 'true';
  });

  // Inline editing state for Checking Account
  const [isEditingChecking, setIsEditingChecking] = useState<boolean>(false);
  const [tempChecking, setTempChecking] = useState<string>(String(checkingBalance));

  // Inline editing state for Savings Account
  const [isEditingSavings, setIsEditingSavings] = useState<boolean>(false);
  const [tempSavings, setTempSavings] = useState<string>(String(savingsBalance));

  // Toggle mask and persist
  const toggleMask = () => {
    setIsMasked(prev => {
      const next = !prev;
      localStorage.setItem('balances_privacy_masked', String(next));
      return next;
    });
  };

  // Save checking balance
  const handleSaveChecking = () => {
    const parsed = parseFloat(tempChecking);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateBalances(parsed, savingsBalance);
      setIsEditingChecking(false);
      triggerCelebration();
    }
  };

  // Save savings balance
  const handleSaveSavings = () => {
    const parsed = parseFloat(tempSavings);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateBalances(checkingBalance, parsed);
      setIsEditingSavings(false);
      triggerCelebration();
    }
  };

  // Real Available Liquidity (Current Balance minus unpaid commitments remaining for this month)
  const realAvailableLiquidity = calculateNetRealLiquidity(checkingBalance, unpaidCommitments);

  // Total Combined Net Liquidity
  const totalNetLiquidity = calculateTotalLiquidNetWorth(checkingBalance, savingsBalance);

  // Savings progress against emergency target (guarded against division by zero)
  const savingsTargetPct = emergencyTarget > 0 ? Math.min(Math.round((savingsBalance / emergencyTarget) * 100), 100) : 0;

  // Helper to format or mask amounts
  const renderAmount = (amount: number, showSign: boolean = false) => {
    if (isMasked) {
      return '•••••• ر.س';
    }
    const formatted = formatCurrency(Math.abs(amount));
    const sign = showSign && amount > 0 ? '+' : amount < 0 ? '-' : '';
    return `${sign}${formatted} ر.س`;
  };

  return (
    <div className="w-full space-y-3">
      {/* 3-Column Balanced Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
        
        {/* CARD 1: Primary Checking Account (الحساب الأساسي / الجاري) */}
        <div className="glass-panel p-5 rounded-2xl border-blue-500/30 hover:border-blue-500/50 transition-all bg-[rgba(59,130,246,0.04)] flex flex-col justify-between h-full relative overflow-hidden shadow-sm">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">الحساب الأساسي (الجاري)</h4>
                  <span className="text-[11px] text-[var(--ink-muted)]">حساب الراتب والعمليات اليومية</span>
                </div>
              </div>

              {!isReadOnlySimulation ? (
                !isEditingChecking ? (
                  <button
                    onClick={() => {
                      setTempChecking(String(checkingBalance));
                      setIsEditingChecking(true);
                    }}
                    className="text-xs text-blue-300 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition cursor-pointer"
                    title="تعديل رصيد الحساب الجاري"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span className="text-[10px]">تعديل</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={handleSaveChecking}
                      className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition cursor-pointer"
                      title="حفظ"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setIsEditingChecking(false)}
                      className="p-1 rounded bg-white/10 text-[var(--ink-muted)] hover:text-rose-400 transition cursor-pointer"
                      title="إلغاء"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              ) : (
                <span className="text-[10px] text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  توقع المحاكاة
                </span>
              )}
            </div>

            {/* Current Balance Display or Input */}
            <div className="my-3">
              {!isEditingChecking ? (
                <div className="text-2xl sm:text-3xl font-black text-white font-mono num-ltr">
                  {renderAmount(checkingBalance)}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={tempChecking}
                    onChange={(e) => setTempChecking(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveChecking()}
                    className="w-full bg-black/60 border border-blue-500 rounded-lg px-3 py-1.5 text-lg font-mono num-ltr text-white outline-none"
                    autoFocus
                  />
                  <span className="text-xs text-[var(--ink-muted)] font-sans">ر.س</span>
                </div>
              )}
            </div>
          </div>

          {/* Sub-metric: Real Available Liquidity */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-[var(--ink-muted)] flex items-center gap-1">
              <span>السيولة المتاحة الحقيقية:</span>
            </span>
            <span 
              className={`font-mono num-ltr font-extrabold ${
                realAvailableLiquidity >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
              title="الرصيد الجاري مخصوماً منه كافة التزامات الشهر الثابتة والأقساط"
            >
              {renderAmount(realAvailableLiquidity, true)}
            </span>
          </div>
        </div>

        {/* CARD 2: Savings & Emergency Reserve (حساب الادخار والاحتياط) */}
        <div className="glass-panel p-5 rounded-2xl border-emerald-500/30 hover:border-emerald-500/50 transition-all bg-[rgba(16,185,129,0.04)] flex flex-col justify-between h-full relative overflow-hidden shadow-sm">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <PiggyBank className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">حساب الادخار والاحتياط</h4>
                  <span className="text-[11px] text-[var(--ink-muted)]">مخصص الطوارئ وبناء الأصول</span>
                </div>
              </div>

              {!isReadOnlySimulation ? (
                <div className="flex items-center gap-1.5">
                  {onOpenSavingsModal && (
                    <button
                      onClick={onOpenSavingsModal}
                      className="text-xs text-emerald-300 hover:text-white flex items-center gap-1 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition cursor-pointer font-bold"
                      title="إيداع مبلغ جديد في حساب الادخار"
                    >
                      <span>+ إيداع</span>
                    </button>
                  )}
                  {!isEditingSavings ? (
                    <button
                      onClick={() => {
                        setTempSavings(String(savingsBalance));
                        setIsEditingSavings(true);
                      }}
                      className="text-xs text-[var(--ink-muted)] hover:text-white p-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
                      title="تعديل رصيد الادخار"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={handleSaveSavings}
                        className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition cursor-pointer"
                        title="حفظ"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setIsEditingSavings(false)}
                        className="p-1 rounded bg-white/10 text-[var(--ink-muted)] hover:text-rose-400 transition cursor-pointer"
                        title="إلغاء"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  ادخار محمي 🔒
                </span>
              )}
            </div>

            {/* Current Balance Display or Input */}
            <div className="my-3">
              {!isEditingSavings ? (
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono num-ltr">
                  {renderAmount(savingsBalance)}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={tempSavings}
                    onChange={(e) => setTempSavings(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveSavings()}
                    className="w-full bg-black/60 border border-emerald-500 rounded-lg px-3 py-1.5 text-lg font-mono num-ltr text-white outline-none"
                    autoFocus
                  />
                  <span className="text-xs text-[var(--ink-muted)] font-sans">ر.س</span>
                </div>
              )}
            </div>
          </div>

          {/* Sub-metric: Progress Bar against Emergency Safety Net */}
          <div className="pt-3 border-t border-white/5 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--ink-muted)] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>شبكة الأمان ({formatCurrency(emergencyTarget)} ر.س):</span>
              </span>
              <span className="font-mono num-ltr text-emerald-400 font-bold">
                {savingsTargetPct}%
              </span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${savingsTargetPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* CARD 3: Total Net Liquidity (إجمالي النقد والسيولة الشاملة) */}
        <div className="glass-panel p-5 rounded-2xl border-indigo-500/30 hover:border-indigo-500/50 transition-all bg-[rgba(99,102,241,0.04)] flex flex-col justify-between h-full relative overflow-hidden shadow-sm">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                  <Landmark className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">إجمالي السيولة الشاملة</h4>
                  <span className="text-[11px] text-[var(--ink-muted)]">مجموع الحساب الجاري + الادخار</span>
                </div>
              </div>

              {/* Privacy Mask Toggle */}
              <button
                onClick={toggleMask}
                className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs cursor-pointer ${
                  isMasked 
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25' 
                    : 'bg-white/5 border-white/10 text-[var(--ink-muted)] hover:text-white hover:bg-white/10'
                }`}
                title={isMasked ? 'إظهار الأرصدة الرقمية' : 'إخفاء الأرصدة (وضع الخصوصية في الأماكن العامة)'}
              >
                {isMasked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="text-[10px] font-bold">
                  {isMasked ? 'مخفي' : 'خصوصية'}
                </span>
              </button>
            </div>

            {/* Total Balance Display */}
            <div className="my-3">
              <div className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono num-ltr">
                {renderAmount(totalNetLiquidity)}
              </div>
            </div>
          </div>

          {/* Sub-metric: Net Cash Cushion */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-[var(--ink-muted)] flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>المركز المالي الإجمالي:</span>
            </span>
            <span className="font-mono text-indigo-300 font-bold">
              {isMasked ? '••••••' : 'موقف نقدي قوي ✓'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
