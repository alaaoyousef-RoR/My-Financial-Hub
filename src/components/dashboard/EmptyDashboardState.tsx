import React from 'react';
import { 
  Sparkles, 
  Plus, 
  FileSpreadsheet, 
  Wallet, 
  ArrowUpRight, 
  TrendingUp, 
  ShieldCheck, 
  Receipt,
  PiggyBank
} from 'lucide-react';

interface EmptyDashboardStateProps {
  onOpenExpenseModal: () => void;
  onOpenIncomeModal: () => void;
  onOpenStatementImportModal: () => void;
  onOpenStartingBalanceModal?: () => void;
}

export const EmptyDashboardState: React.FC<EmptyDashboardStateProps> = ({
  onOpenExpenseModal,
  onOpenIncomeModal,
  onOpenStatementImportModal,
  onOpenStartingBalanceModal
}) => {
  return (
    <div 
      className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0c162c] via-[#091122] to-[#070c18] relative overflow-hidden text-center space-y-6 shadow-2xl font-['Readex_Pro',sans-serif]"
      dir="rtl"
    >
      {/* Decorative Blur Spheres */}
      <div className="absolute -top-10 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-10 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 max-w-2xl mx-auto space-y-3">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>مرحباً بك في مركز الإدارة المالية الشخصية!</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          لوحة التحكم جاهزة لاستقبال بياناتك المالية 📊
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
          لا توجد عمليات مسجلة حتى الآن. ابدأ بتحديد رصيدك الافتتاحي، تسجيل أول مصروف، أو استيراد كشف حسابك البنكي تلقائياً بضغطة زر.
        </p>
      </div>

      {/* Actionable Quick Launch Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-4xl mx-auto">
        
        {/* CTA 1: Set Starting Balance */}
        {onOpenStartingBalanceModal && (
          <button
            type="button"
            onClick={onOpenStartingBalanceModal}
            className="p-4 rounded-2xl bg-[#090e1a]/90 hover:bg-[#0d1628] border border-blue-500/30 hover:border-blue-500/60 text-right transition-all group cursor-pointer flex flex-col justify-between space-y-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xs text-white block mb-0.5">
                تحديد الرصيد الافتتاحي
              </span>
              <p className="text-[11px] text-slate-400">
                أدخل رصيدك الجاري الحالي لبدء احتساب حد الصرف الآمن بدقة.
              </p>
            </div>
          </button>
        )}

        {/* CTA 2: Import Statement */}
        <button
          type="button"
          onClick={onOpenStatementImportModal}
          className="p-4 rounded-2xl bg-[#090e1a]/90 hover:bg-[#0d1628] border border-emerald-500/30 hover:border-emerald-500/60 text-right transition-all group cursor-pointer flex flex-col justify-between space-y-3 shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xs text-white block mb-0.5">
              استيراد كشف بنكي (.xlsx)
            </span>
            <p className="text-[11px] text-slate-400">
              ارفع ملف كشف حسابك من مصرف الإنماء أو الراجحي مع التصنيف الآلي.
            </p>
          </div>
        </button>

        {/* CTA 3: Add Income */}
        <button
          type="button"
          onClick={onOpenIncomeModal}
          className="p-4 rounded-2xl bg-[#090e1a]/90 hover:bg-[#0d1628] border border-slate-800 hover:border-slate-700 text-right transition-all group cursor-pointer flex flex-col justify-between space-y-3 shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xs text-white block mb-0.5">
              + إضافة مصدر دخل
            </span>
            <p className="text-[11px] text-slate-400">
              سجّل راتبك الأساسي أو عوائد العمل الحر والاستثمارات الدورية.
            </p>
          </div>
        </button>

        {/* CTA 4: Log Expense */}
        <button
          type="button"
          onClick={onOpenExpenseModal}
          className="p-4 rounded-2xl bg-[#090e1a]/90 hover:bg-[#0d1628] border border-slate-800 hover:border-slate-700 text-right transition-all group cursor-pointer flex flex-col justify-between space-y-3 shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xs text-white block mb-0.5">
              + تسجيل أول عملية صرف
            </span>
            <p className="text-[11px] text-slate-400">
              سجّل مشترياتك اليومية لمتابعة المتبقي من ميزانية الأسبوع.
            </p>
          </div>
        </button>

      </div>

      {/* Safe Math Callout */}
      <div className="relative z-10 pt-2 text-center">
        <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>حسابات صارمة مانعة للقيم غير المعرفة (0% بدلاً من خطأ NaN) مع حفظ سحابي مشفر.</span>
        </span>
      </div>
    </div>
  );
};
