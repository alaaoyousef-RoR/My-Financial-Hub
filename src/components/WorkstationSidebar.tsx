import React, { useState } from 'react';
import { formatCurrency, triggerCelebration } from '../utils/formatters';
import { CarPlan, MonthlyRecord } from '../types/finance';
import { Target, Sparkles, Car, CheckCircle2 } from 'lucide-react';

interface WorkstationSidebarProps {
  currentMonthRecord: MonthlyRecord;
  carPlan: CarPlan;
  onPayCarInstallment?: () => void;
  isReadOnlySimulation?: boolean;
}

export const WorkstationSidebar: React.FC<WorkstationSidebarProps> = ({
  currentMonthRecord,
  carPlan,
  onPayCarInstallment,
  isReadOnlySimulation = false
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const curr = currentMonthRecord || { month: 'الشهر الحالي', car: 0, tamara: 0, tabby: 0, gas: 0, home: 0 };
  const donutItems = [
    { label: 'تمارا (Tamara)', value: curr.tamara, color: '#f43f5e' },
    { label: 'السيارة', value: curr.car, color: '#3b82f6' },
    { label: 'بنزين', value: curr.gas, color: '#f59e0b' },
    { label: 'السكن', value: curr.home, color: '#71717a' },
    { label: 'تابي (Tabby)', value: curr.tabby, color: '#10b981' }
  ];

  const total = donutItems.reduce((a, b) => a + b.value, 0);

  // SVG Donut calculation
  const radius = 56;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  const carProgressPct = carPlan.totalInstallments > 0 
    ? Math.round((carPlan.paidInstallments / carPlan.totalInstallments) * 100) 
    : 0;
  const carRemaining = Math.max(carPlan.totalInstallments - carPlan.paidInstallments, 0);

  return (
    <aside className="sidebar space-y-4">
      
      {/* 1. Car Financing Card matching Variation 5 */}
      <div className="glass-panel stat-card p-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-blue-400" />
            <span className="label-mono font-bold text-blue-400">خطة تمويل السيارة</span>
          </div>
          <span className="label-mono text-[var(--ink-muted)]">
            <span className="num-ltr font-mono font-bold">{carPlan.paidInstallments}/{carPlan.totalInstallments}</span>
          </span>
        </div>

        <div className="flex justify-between items-center mt-3 text-xs">
          <span className="text-[var(--ink)]">سداد <span className="num-ltr font-mono font-bold text-white">{carPlan.paidInstallments}</span> من <span className="num-ltr font-mono font-bold text-white">{carPlan.totalInstallments}</span> قسطاً</span>
          <span className="num-ltr font-mono font-bold text-[var(--accent)]">{carProgressPct}%</span>
        </div>

        {/* Progress Container with Variation 5 gradient */}
        <div className="w-full h-2 bg-[rgba(255,255,255,0.08)] rounded-full mt-2.5 overflow-hidden border border-[var(--glass-border)]">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(carProgressPct, 100)}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--indigo))'
            }}
          ></div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-[var(--glass-border)] text-xs space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--ink-muted)]">الأقساط المتبقية:</span>
            <span className="font-mono text-amber-400 font-bold"><span className="num-ltr">{carRemaining}</span> شهراً</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--ink-muted)]">الدفعة الأخيرة:</span>
            <span className="num-ltr font-mono font-bold text-amber-400">{formatCurrency(carPlan.balloonPayment)} ر.س</span>
          </div>
        </div>

        {onPayCarInstallment && carRemaining > 0 && !isReadOnlySimulation && (
          <button
            onClick={() => {
              onPayCarInstallment();
              triggerCelebration();
            }}
            className="btn btn-primary w-full text-xs py-2 mt-3.5 flex items-center justify-center gap-1.5 shadow-sm"
            title="تسجيل سداد قسط السيارة لهذا الشهر فوراً"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>+ سداد قسط ({formatCurrency(carPlan.monthlyInstallment)} ر.س)</span>
          </button>
        )}
      </div>

      {/* 2. Commitments Analysis Donut with Variation 5 styling */}
      <div 
        className="glass-panel stat-card p-5"
        style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), transparent)' }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="label-mono font-bold text-[var(--indigo)]">تحليل التزامات {curr.month}</span>
          <span className="num-ltr text-xs font-mono font-bold text-[var(--ink)]">{formatCurrency(total)} <small className="text-[10px] text-[var(--ink-muted)]">ر.س</small></span>
        </div>

        {/* Circular Donut Visualization */}
        <div className="relative w-32 h-32 mx-auto my-2 flex items-center justify-center">
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90 transform">
            {total === 0 ? (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={strokeWidth}
              />
            ) : (
              donutItems.map((item) => {
                const sliceRatio = total > 0 ? item.value / total : 0;
                const strokeDasharray = `${sliceRatio * circumference} ${circumference}`;
                const strokeDashoffset = isNaN(accumulatedOffset) ? 0 : -accumulatedOffset;
                accumulatedOffset += sliceRatio * circumference;

                const isHovered = hoveredSlice === item.label;

                return (
                  <circle
                    key={item.label}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-150 cursor-pointer"
                    onMouseEnter={() => setHoveredSlice(item.label)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                );
              })
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="label-mono text-[9px] text-[var(--ink-muted)]">أقساط</span>
            <span className="text-base font-bold font-mono text-[var(--danger)] num-ltr">
              {total > 0 ? Math.round(((curr.tamara + curr.tabby) / total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="mt-2 pt-2 border-t border-[var(--glass-border)] space-y-1 text-xs">
          {donutItems.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div 
                key={item.label} 
                onMouseEnter={() => setHoveredSlice(item.label)}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`flex justify-between items-center py-1 px-1.5 rounded transition ${
                  hoveredSlice === item.label ? 'bg-[var(--glass-hover)]' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-[var(--ink-muted)] text-[11px]">{item.label}</span>
                </div>
                <span className="num-ltr font-mono text-[var(--ink)] font-semibold text-[11px]">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Strategic Payoff Card matching Variation 5 */}
      <div 
        className="glass-panel stat-card p-5"
        style={{
          background: 'var(--accent-glow)',
          borderColor: 'var(--accent)'
        }}
      >
        <div className="flex items-center justify-between">
          <span className="label-mono font-bold text-[var(--accent)]">التحرر القادم</span>
          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <div className="text-xl font-extrabold font-mono text-[var(--accent)] mt-2">
          <span className="num-ltr">6</span> أشهر متبقية
        </div>
        <p className="text-xs text-[var(--ink-muted)] mt-1.5 leading-relaxed">
          أبريل 2027: تحرر الراتب من كافة الأقساط الاستهلاكية وبداية بناء الأصول الفعلي.
        </p>
        <div className="mt-2 pt-2 border-t border-[var(--accent)]/30 text-[11px]">
          <span className="text-[var(--ink-muted)]">الوفر الصافي المحرر: </span>
          <strong className="num-ltr text-[var(--accent)] font-mono">+{formatCurrency(1725)}</strong> ر.س
        </div>
      </div>

    </aside>
  );
};
