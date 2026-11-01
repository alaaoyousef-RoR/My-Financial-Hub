import React from 'react';
import { 
  Banknote, 
  TrendingDown, 
  Flag, 
  Clock, 
  Lightbulb, 
  CalendarClock,
  Car,
  Layers,
  Wallet,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency, triggerCelebration } from '../utils/formatters';
import { MonthlyRecord, ReceivableRecord, CarPlan } from '../types/finance';

interface KPICardsProps {
  currentMonthRecord: MonthlyRecord;
  receivables: ReceivableRecord[];
  allMonths: MonthlyRecord[];
  carPlan: CarPlan;
  totalIncome: number;
  totalFixed: number;
  totalBNPL: number;
  discretionaryNet: number;
  onPayCarInstallment?: () => void;
  isReadOnlySimulation?: boolean;
}

export const KPICards: React.FC<KPICardsProps> = ({
  currentMonthRecord,
  receivables,
  allMonths,
  carPlan,
  totalIncome,
  totalFixed,
  totalBNPL,
  discretionaryNet,
  onPayCarInstallment,
  isReadOnlySimulation = false
}) => {
  const carProgressPct = carPlan.totalInstallments > 0 
    ? Math.round((carPlan.paidInstallments / carPlan.totalInstallments) * 100) 
    : 0;
  const carRemainingMonths = Math.max(carPlan.totalInstallments - carPlan.paidInstallments, 0);

  // BNPL Freedom Date calculation
  const freedomIndex = allMonths.findIndex(m => m.tamara === 0 && m.tabby === 0);
  const lastInstallmentMonth = freedomIndex > 0 
    ? allMonths[freedomIndex - 1] 
    : (allMonths[0] || currentMonthRecord);
  const monthsUntilFreedom = freedomIndex > 0 ? freedomIndex : 0;

  const nextMonth = allMonths[1];
  const dropAmount = (nextMonth && currentMonthRecord.tamara > nextMonth.tamara) 
    ? currentMonthRecord.tamara - nextMonth.tamara 
    : 0;
  const dropPct = currentMonthRecord.tamara > 0 
    ? Math.round((dropAmount / currentMonthRecord.tamara) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      
      {/* 4 Semantic KPI Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1: Total Income (Emerald Green) */}
        <div className="stat-card glass-panel p-5 flex flex-col justify-between border-[rgba(16,185,129,0.3)] hover:border-[var(--accent)] transition">
          <div className="flex justify-between items-center">
            <span className="label-mono text-[var(--accent)] font-bold">1. إجمالي الدخل</span>
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-glow)] border border-[var(--accent)] text-[var(--accent)] flex items-center justify-center">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-[var(--accent)] num-ltr">
              {formatCurrency(totalIncome)} <small className="text-xs text-[var(--ink-muted)] font-sans">ر.س</small>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[var(--glass-border)] flex justify-between text-[11px] text-[var(--ink-muted)]">
            <span>الراتب والمصادر النشطة</span>
            <span className="text-[var(--accent)] font-semibold">مستقر ومؤكد</span>
          </div>
        </div>

        {/* Stat 2: Fixed Monthly Commitments (Blue/Slate) */}
        <div className="stat-card glass-panel p-5 flex flex-col justify-between border-blue-500/30 hover:border-blue-400 transition">
          <div className="flex justify-between items-center">
            <span className="label-mono text-blue-400 font-bold">2. الالتزامات الشهرية الثابتة</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Car className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-blue-400 num-ltr">
              {formatCurrency(totalFixed)} <small className="text-xs text-[var(--ink-muted)] font-sans">ر.س</small>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[var(--glass-border)] flex justify-between text-[11px] text-[var(--ink-muted)]">
            <span>سيارة + سكن + بنزين</span>
            <span className="text-blue-300 font-semibold font-mono num-ltr">3 بنود</span>
          </div>
        </div>

        {/* Stat 3: Tamara & Tabby BNPL (Rose/Red) */}
        <div className="stat-card glass-panel p-5 flex flex-col justify-between border-[rgba(255,77,77,0.35)]! hover:border-[var(--danger)] transition">
          <div className="flex justify-between items-center">
            <span className="label-mono text-rose-400 font-bold">3. أقساط تمارا وتابي</span>
            <div className="w-7 h-7 rounded-lg bg-[rgba(255,77,77,0.15)] border border-[rgba(255,77,77,0.4)] text-[var(--danger)] flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-[var(--danger)] num-ltr">
              {formatCurrency(totalBNPL)} <small className="text-xs text-[var(--ink-muted)] font-sans">ر.س</small>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[var(--glass-border)] flex justify-between text-[11px] text-rose-400">
            <span>ذروة التزامات الدفع الآجل</span>
            <span className="font-semibold">تنتهي قريباً</span>
          </div>
        </div>

        {/* Stat 4: Free Discretionary Net (Emerald Green or Red if deficit) */}
        <div className={`stat-card glass-panel p-5 flex flex-col justify-between transition ${
          discretionaryNet >= 0 
            ? 'border-[var(--accent)]/40 hover:border-[var(--accent)] bg-[rgba(16,185,129,0.03)]' 
            : 'border-[var(--danger)]/50 hover:border-[var(--danger)] bg-[rgba(255,77,77,0.05)]'
        }`}>
          <div className="flex justify-between items-center">
            <span className={`label-mono font-bold ${discretionaryNet >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`}>
              4. الصافي الحر المتاح
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              discretionaryNet >= 0 
                ? 'bg-[var(--accent-glow)] border border-[var(--accent)] text-[var(--accent)]' 
                : 'bg-[rgba(255,77,77,0.15)] border border-[var(--danger)] text-[var(--danger)]'
            }`}>
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-bold font-mono num-ltr ${discretionaryNet >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`}>
              {discretionaryNet >= 0 ? '+' : ''}{formatCurrency(discretionaryNet)} <small className="text-xs text-[var(--ink-muted)] font-sans">ر.س</small>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[var(--glass-border)] flex justify-between text-[11px]">
            <span className="text-[var(--ink-muted)]">المتبقي للمصروف والادخار</span>
            <span className={`font-semibold ${discretionaryNet >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`}>
              {discretionaryNet >= 0 ? 'فائض متاح' : 'عجز مؤقت بالذروة'}
            </span>
          </div>
        </div>

      </div>

      {/* 2 Focus Trackers: Car Installment Countdown + Financial Freedom Milestone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        
        {/* Car Financing Countdown Card */}
        <div className="glass-panel p-5 space-y-3.5 border-blue-500/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-[var(--ink)]">عداد تمويل السيارة (60 قسطاً)</h3>
                <p className="text-[11px] text-[var(--ink-muted)]">قسط شهري: <strong className="font-mono text-white num-ltr">{formatCurrency(carPlan.monthlyInstallment)}</strong> ر.س</p>
              </div>
            </div>

            {onPayCarInstallment && carRemainingMonths > 0 && !isReadOnlySimulation && (
              <button
                onClick={() => {
                  onPayCarInstallment();
                  triggerCelebration();
                }}
                className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
                title="تسجيل سداد قسط هذا الشهر فوراً (+1 شهر)"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>+ سداد قسط الآن</span>
              </button>
            )}
            {isReadOnlySimulation && (
              <span className="text-[10px] text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg font-bold">
                وضع المحاكاة (قراءة فقط)
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--ink-muted)]">
                تم سداد <strong className="font-mono text-white num-ltr font-bold">{carPlan.paidInstallments}</strong> من أصل <strong className="font-mono text-white num-ltr">{carPlan.totalInstallments}</strong> قسطاً
              </span>
              <span className="text-blue-400 font-mono font-bold num-ltr">{carProgressPct}%</span>
            </div>
            <div className="w-full h-2.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden p-0.5 border border-[var(--glass-border)]">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(carProgressPct, 100)}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #10b981)'
                }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--glass-border)] text-xs">
            <div className="bg-[rgba(0,0,0,0.25)] p-2.5 rounded-xl border border-[var(--glass-border)]">
              <span className="label-mono text-amber-400 block">الأقساط المتبقية</span>
              <span className="text-sm font-bold font-mono text-amber-400 num-ltr block mt-0.5">
                {carRemainingMonths} شهراً
              </span>
            </div>
            <div className="bg-[rgba(0,0,0,0.25)] p-2.5 rounded-xl border border-[var(--glass-border)]">
              <span className="label-mono text-purple-400 block">الدفعة الأخيرة (37k)</span>
              <span className="text-sm font-bold font-mono text-purple-400 num-ltr block mt-0.5">
                {formatCurrency(carPlan.balloonPayment)} <small className="text-[10px] text-[var(--ink-muted)]">ر.س</small>
              </span>
            </div>
          </div>
        </div>

        {/* Financial Liberation (BNPL Freedom Date) Card */}
        <div className="glass-panel p-5 space-y-3.5 border-purple-500/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/40 text-purple-400 flex items-center justify-center">
                <Flag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-[var(--ink)]">عداد التحرر المالي (BNPL Freedom)</h3>
                <p className="text-[11px] text-[var(--ink-muted)]">موعد الصفرية الكاملة لأقساط تمارا وتابي</p>
              </div>
            </div>

            <span className="label-mono text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
              {lastInstallmentMonth?.month || 'Mar-27'}
            </span>
          </div>

          <div className="bg-[rgba(129,140,248,0.08)] border border-purple-500/30 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="label-mono text-purple-300 block">الوفر الشهري الإضافي المرتقب:</span>
              <p className="text-lg font-bold font-mono text-purple-400 num-ltr mt-0.5">
                +{formatCurrency(totalBNPL)} <small className="text-xs text-[var(--ink-muted)]">ر.س / شهرياً</small>
              </p>
            </div>
            <div className="text-left font-mono">
              <span className="text-2xl font-extrabold text-[var(--accent)] num-ltr">{monthsUntilFreedom}</span>
              <span className="text-[11px] text-[var(--ink-muted)] block">أشهر متبقية</span>
            </div>
          </div>

          <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed pt-1 border-t border-[var(--glass-border)]">
            🎯 بمجرد وصول شهر <strong>إبريل 2027</strong>، ستصبح التزامات تمارا وتابي <strong>0.00 ر.س</strong>، مما يرفع فائضك الحر التلقائي إلى أكثر من <strong>1,725 ريال</strong> كل شهر!
          </p>
        </div>

      </div>

      {/* Banner matching Variation 5: Intelligent Cash Flow Relief Indicator */}
      <div 
        className="p-4 rounded-xl flex items-center gap-3.5 shadow-sm border"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.04))',
          borderColor: 'rgba(16, 185, 129, 0.35)'
        }}
      >
        <div className="text-2xl shrink-0">💡</div>
        <div className="flex-1">
          {currentMonthRecord.tamara === 0 && (!nextMonth || nextMonth.tamara === 0) ? (
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs sm:text-sm text-[var(--ink)]">
                  مؤشر الانفراج المالي التلقائي: <span className="text-emerald-400 font-bold">التحرر الكامل من أقساط الدفع الآجل 🎉</span>
                </h3>
                <span className="label-mono hidden sm:inline-block text-[10px] text-[var(--accent)] bg-[var(--glass-thick)] px-2 py-0.5 rounded border border-[var(--accent)]/40 font-bold">
                  Zero Debt
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-1 leading-relaxed">
                لا توجد أي أقساط دفع آجل مسجلة (0.00 ر.س). سيولتك وصافيك الشهري متاح بالكامل للمصروفات الأساسية وبناء الأصول الادخارية!
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs sm:text-sm text-[var(--ink)]">
                  مؤشر الانفراج المالي التلقائي: انخفاض بنسبة <span className="num-ltr font-mono text-[var(--accent)] font-bold">{dropPct}%</span>
                </h3>
                <span className="label-mono hidden sm:inline-block text-[10px] text-[var(--accent)] bg-[var(--glass-thick)] px-2 py-0.5 rounded border border-[var(--accent)]/40 font-bold">
                  توقعات مؤكدة
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-1 leading-relaxed">
                الشهر الحالي يسجل التزامات تمارا بقيمة <strong className="num-ltr font-mono text-white">{formatCurrency(currentMonthRecord.tamara)} ر.س</strong>. بدءاً من الشهر القادم، سينخفض القسط تلقائياً إلى{' '}
                <span className="num-ltr font-mono text-[var(--ink)] font-bold">
                  {nextMonth ? formatCurrency(nextMonth.tamara) : '0.00'}
                </span>{' '}
                ر.س، مما يوفر لك سيولة إضافية بقيمة{' '}
                <strong className="num-ltr font-mono text-[var(--accent)]">
                  +{formatCurrency(dropAmount)}
                </strong>{' '}
                ر.س شهرياً!
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
