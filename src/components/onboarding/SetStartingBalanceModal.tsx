import React, { useState } from 'react';
import { 
  Wallet, 
  Sparkles, 
  Check, 
  X, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinancialState } from '../../context/FinancialContext';
import { setStartingOpeningBalance } from '../../services/userService';
import { formatCurrency, triggerCelebration } from '../../utils/formatters';

interface SetStartingBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (balance: number) => void;
}

export const SetStartingBalanceModal: React.FC<SetStartingBalanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { 
    accountBalances, 
    setAccountBalances, 
    setExpenses, 
    setTransactions, 
    showToast 
  } = useFinancialState();

  const [balanceInput, setBalanceInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('رصيد افتتاحي لبدء التتبع');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickPresets = [0, 1000, 3000, 5000, 10000];

  const handleSubmit = async (overrideAmount?: number) => {
    const rawVal = overrideAmount !== undefined ? overrideAmount : parseFloat(balanceInput);
    if (isNaN(rawVal) || rawVal < 0) {
      setError('يرجى إدخال مبلغ صحيح (0 أو أكبر).');
      return;
    }

    if (!user) {
      setError('يجب تسجيل الدخول أولاً لحفظ الرصيد.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await setStartingOpeningBalance(user.uid, rawVal, notesInput);
      if (res.success) {
        // Synchronously update FinancialContext state for instant UI response
        setAccountBalances(prev => ({
          ...prev,
          checkingBalance: res.newBalance,
          lastUpdated: new Date().toISOString()
        }));

        if (res.newBalance > 0) {
          setExpenses(prev => [res.initialExpenseRecord, ...prev]);
        }
        setTransactions(prev => [res.initialTransaction, ...prev]);

        triggerCelebration();
        showToast(`تم تعيين الرصيد الافتتاحي: ${formatCurrency(res.newBalance)} ر.س بنجاح! 🚀`);

        if (onSuccess) {
          onSuccess(res.newBalance);
        }
        onClose();
      }
    } catch (err: any) {
      console.error('Error saving opening balance:', err);
      setError(err.message || 'حدث خطأ أثناء حفظ الرصيد الافتتاحي.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-['Readex_Pro',sans-serif]">
      <div 
        className="w-full max-w-lg bg-[#090e1a] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-[#070c16]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                تحديد الرصيد الافتتاحي للبدء
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-bold">
                  إعداد أولي
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                أدخل رصيدك الجاري المتوفر حالياً في حسابك أو محفظتك
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              الرصيد المتاح حالياً في الحساب الجاري (ر.س)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                autoFocus
                className="w-full bg-[#070c18] border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl px-4 py-3 text-lg font-mono font-bold text-white placeholder-slate-600 outline-none transition"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                ر.س SAR
              </span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 block font-medium">خيارات سريعة:</span>
            <div className="flex flex-wrap gap-2">
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBalanceInput(String(preset))}
                  className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-slate-800 text-xs text-slate-300 hover:text-white transition font-mono"
                >
                  {preset === 0 ? 'رصيد صفري (0)' : `${formatCurrency(preset)} ر.س`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              بيان العملية (ملاحظة اختيارية)
            </label>
            <input
              type="text"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="مثال: رصيد بداية الشهر / رصيد افتتاحي"
              className="w-full bg-[#070c18] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
            />
          </div>

          {/* Explanatory benefit callout */}
          <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>لماذا نطلب الرصيد الافتتاحي؟</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              يُستخدم هذا الرصيد كحجر أساس لحساب حد الصرف الآمن اليومي، ومراقبة حركة السيولة، دون التأثير على حساب إجمالي رواتبك أو ديونك.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-[#070c16]">
          <button
            type="button"
            onClick={() => handleSubmit(0)}
            disabled={isLoading}
            className="text-xs font-bold text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            البدء برصيد 0.00 ر.س
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isLoading}
              className="btn btn-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>تأكيد وبدء التتبع</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
