import React, { useState } from 'react';
import { InstallmentRecord, ReceivableRecord } from '../types/finance';
import { formatCurrency, triggerCelebration } from '../utils/formatters';
import { 
  Sparkles, 
  Flame, 
  Target, 
  CheckCircle2, 
  ArrowRight, 
  Calculator, 
  Zap,
  TrendingUp,
  Coins
} from 'lucide-react';

interface FreedomPlannerProps {
  installments: InstallmentRecord[];
  receivables: ReceivableRecord[];
}

export const FreedomPlanner: React.FC<FreedomPlannerProps> = ({
  installments,
  receivables
}) => {
  const pendingReceivablesTotal = receivables
    .filter(r => r.status === 'معلق')
    .reduce((sum, r) => sum + r.amount, 0);

  const [simulatedBonus, setSimulatedBonus] = useState<number>(pendingReceivablesTotal);
  const [selectedToPayoff, setSelectedToPayoff] = useState<string[]>([]);

  const activeInstallments = installments.filter(i => i.status === 'active');

  const toggleSelect = (id: string) => {
    setSelectedToPayoff(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Calculate monthly cashflow freed up
  const freedMonthlyCash = activeInstallments
    .filter(i => selectedToPayoff.includes(i.id))
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-900 text-lg">خطة التعجيل والتحرر المالي الذكية</h2>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">
            محاكي السداد السريع
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          شاهد كيف يؤدي تحصيل ديونك وسداد الأقساط الصغيرة إلى مضاعفة سيولتك الشهرية فوراً (استراتيجية كرة الثلج المالية)
        </p>
      </div>

      {/* Simulator Control Box */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>مبلغ السيولة المتاح للاستخدام الفوري (تحصيل الديون أو وفر إضافي)</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="number"
                value={simulatedBonus}
                onChange={(e) => setSimulatedBonus(parseFloat(e.target.value) || 0)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 font-mono text-xl font-bold text-white w-48 outline-none focus:border-amber-400"
              />
              <span className="text-sm text-slate-300">ريال سعودي</span>
            </div>
          </div>

          {/* Quick inject from receivables button */}
          <button
            onClick={() => setSimulatedBonus(pendingReceivablesTotal)}
            className="cursor-pointer bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs px-3 py-2 rounded-lg transition flex items-center gap-2"
          >
            <Coins className="w-4 h-4 text-amber-300" />
            <span>استخدم إجمالي ديون السوق ({formatCurrency(pendingReceivablesTotal)} ر.س)</span>
          </button>
        </div>

        {/* Dynamic Impact Result */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <span className="text-xs text-slate-400 block">الوفر الشهري الإضافي المستدام:</span>
            <p className="text-2xl font-bold font-mono text-emerald-400 num-ltr mt-1">
              +{formatCurrency(freedMonthlyCash)} <span className="text-xs font-normal text-slate-300">ر.س / شهر</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              سيولة شهرية إضافية تعود لجيبك مباشرة كل شهر بدلاً من خصمها للمتاجر!
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <span className="text-xs text-slate-400 block">الأقساط المحددة للتصفية الفورية:</span>
            <p className="text-2xl font-bold font-mono text-amber-400 num-ltr mt-1">
              {selectedToPayoff.length} <span className="text-xs font-normal text-slate-300">من أصل {activeInstallments.length}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {selectedToPayoff.length > 0 
                ? 'انقر للمزيد من الأقساط لتحرير أكبر قدر ممكن من الراتب' 
                : 'حدد من القائمة أدناه الأقساط التي ترغب في إغلاقها'}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Selection List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>اختر الأقساط المرشحة للإغلاق السريع (رتبت من الأصغر للأكبر):</span>
          </h3>

          <button
            onClick={() => {
              // Select all except the largest (Iphone)
              const ids = activeInstallments.filter(i => i.amount < 500).map(i => i.id);
              setSelectedToPayoff(ids);
              triggerCelebration();
            }}
            className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition"
          >
            تحديد كافة الأقساط الصغيرة تلقائياً
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeInstallments
            .slice()
            .sort((a, b) => a.amount - b.amount)
            .map((item) => {
              const isSelected = selectedToPayoff.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      isSelected 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900">{item.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          item.platform === 'Tamara' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {item.platform}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{item.remainingNote}</span>
                    </div>
                  </div>

                  <div className="text-left font-mono num-ltr">
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                    <span className="text-[10px] text-slate-500 block">ر.س / شهر</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Strategic Rule of Thumb */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-600" />
          <span>قاعدة الخلاص المالي الذهبية لميزانيتك:</span>
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          1. <strong>لا تفتح أي قسط جديد في تمارا أو تابي نهائياً</strong> حتى شهر إبريل 2027.
          <br />
          2. في نوفمبر القادم سينخفض التزامك بأكثر من <strong>1,250 ريال</strong> تلقائياً. احتفظ بهذا الفارق كاحتياطي نقدي.
          <br />
          3. بعد إبريل 2027، سيكون صافي راتبك الشهري الحر <strong>1,725 ريال</strong> شهرياً، وهو ما يتيح لك بناء مدخرات تفوق <strong>20,000 ريال سنوياً</strong>!
        </p>
      </div>

    </div>
  );
};
