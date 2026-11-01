import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { Sparkles, HelpCircle } from 'lucide-react';

interface CashFlowPipelineProps {
  totalIncome: number;
  totalFixed: number;
  totalBNPL: number;
  totalPersonalExpenses: number;
  totalSavings: number;
}

export const CashFlowPipeline: React.FC<CashFlowPipelineProps> = ({
  totalIncome,
  totalFixed,
  totalBNPL,
  totalPersonalExpenses,
  totalSavings
}) => {
  const availableForDiscretionary = totalIncome - totalFixed - totalBNPL;
  const endingBalance = availableForDiscretionary - totalPersonalExpenses - totalSavings;

  return (
    <div className="glass-panel p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[var(--glass-border)] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] border border-[var(--accent)] text-[var(--accent)] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--ink)]">معادلة التدفق المحاسبي الصارمة (Cash Flow Equation)</h3>
            <p className="text-[11px] text-[var(--ink-muted)]">الصافي المتاح للمصروفات والادخار = الدخل - الثوابت - أقساط تمارا وتابي</p>
          </div>
        </div>

        <span className="label-mono text-[10px] text-[var(--accent)] bg-[var(--glass-thick)] px-2.5 py-1 rounded-full border border-[var(--accent)]/40 font-bold">
          FORMULA VERIFIED
        </span>
      </div>

      {/* Visual Equation Pipeline Grid matching Variation 5 */}
      <div className="equation-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-center">
        
        {/* 1. Income */}
        <div className="equation-cell rounded-xl p-3 flex flex-col justify-between border border-[rgba(16,185,129,0.3)] bg-[rgba(0,0,0,0.25)]">
          <span className="label-mono text-[var(--accent)] mb-1 block font-bold">1. إجمالي الدخل</span>
          <p className="text-xl font-bold font-mono text-[var(--accent)] num-ltr">
            {formatCurrency(totalIncome)}
          </p>
          <span className="text-[10px] text-[var(--ink-muted)] mt-1 block">الراتب الأساسي</span>
        </div>

        {/* 2. Fixed */}
        <div className="equation-cell rounded-xl p-3 flex flex-col justify-between border border-[rgba(129,140,248,0.3)] bg-[rgba(0,0,0,0.25)]">
          <span className="label-mono text-[var(--indigo)] mb-1 block font-bold">2. الثوابت (-)</span>
          <p className="text-xl font-bold font-mono text-[var(--indigo)] num-ltr">
            {formatCurrency(totalFixed)}
          </p>
          <span className="text-[10px] text-[var(--ink-muted)] mt-1 block">سيارة + سكن + بنزين</span>
        </div>

        {/* 3. BNPL */}
        <div className="equation-cell rounded-xl p-3 flex flex-col justify-between border border-[rgba(255,77,77,0.3)] bg-[rgba(0,0,0,0.25)]">
          <span className="label-mono text-[var(--danger)] mb-1 block font-bold">3. الأقساط (-)</span>
          <p className="text-xl font-bold font-mono text-[var(--danger)] num-ltr">
            {formatCurrency(totalBNPL)}
          </p>
          <span className="text-[10px] text-[var(--ink-muted)] mt-1 block">تمارا + تابي</span>
        </div>

        {/* 4. Discretionary */}
        <div className={`equation-cell rounded-xl p-3 flex flex-col justify-between border ${
          availableForDiscretionary >= 0 
            ? 'border-[var(--indigo)]/50 bg-[rgba(129,140,248,0.08)]' 
            : 'border-[var(--danger)]/50 bg-[rgba(255,77,77,0.12)]'
        }`}>
          <span className="label-mono text-[var(--indigo)] mb-1 block font-bold">4. الصافي المتاح</span>
          <p className={`text-xl font-bold font-mono num-ltr ${
            availableForDiscretionary >= 0 ? 'text-[var(--indigo)]' : 'text-[var(--danger)]'
          }`}>
            {availableForDiscretionary >= 0 ? '+' : ''}{formatCurrency(availableForDiscretionary)}
          </p>
          <span className="text-[10px] text-[var(--ink-muted)] mt-1 block">للمصروف والادخار</span>
        </div>

        {/* 5. Ending Surplus */}
        <div className={`equation-cell rounded-xl p-3 flex flex-col justify-between border ${
          endingBalance >= 0 
            ? 'border-[var(--accent)]/50 bg-[rgba(16,185,129,0.08)]' 
            : 'border-[var(--danger)]/50 bg-[rgba(255,77,77,0.12)]'
        }`}>
          <span className="label-mono text-[var(--ink-muted)] mb-1 block font-bold">5. الفائض الفعلي</span>
          <p className={`text-xl font-bold font-mono num-ltr ${
            endingBalance >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'
          }`}>
            {endingBalance >= 0 ? '+' : ''}{formatCurrency(endingBalance)}
          </p>
          <span className="text-[10px] text-[var(--ink-muted)] mt-1 block">
            بعد الصرف والادخار
          </span>
        </div>

      </div>

      <div className="text-[11px] text-[var(--ink-muted)] pt-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
          <span>الصافي المتاح = الدخل (<span className="num-ltr">{formatCurrency(totalIncome)}</span>) - الثوابت (<span className="num-ltr">{formatCurrency(totalFixed)}</span>) - الأقساط (<span className="num-ltr">{formatCurrency(totalBNPL)}</span>).</span>
        </div>
        <span className="label-mono text-[var(--accent)] font-bold">REALTIME AUDIT</span>
      </div>
    </div>
  );
};
