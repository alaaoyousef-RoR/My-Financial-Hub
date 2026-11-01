import React from 'react';
import { SavingsItem } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { PiggyBank, ShieldCheck, Plus, Trash2, Lock } from 'lucide-react';

interface SavingsSectionProps {
  savings: SavingsItem[];
  carBalloonTarget: number;
  onAddSavings: (item: SavingsItem) => void;
  onDeleteSavings: (id: string) => void;
  onOpenAddModal: () => void;
  isReadOnlySimulation?: boolean;
}

export const SavingsSection: React.FC<SavingsSectionProps> = ({
  savings,
  carBalloonTarget,
  onAddSavings,
  onDeleteSavings,
  onOpenAddModal,
  isReadOnlySimulation = false
}) => {
  const totalSaved = savings.reduce((sum, item) => sum + item.amount, 0);

  const carBalloonSaved = savings
    .filter(item => item.category === 'مخصص الدفعة الأخيرة للسيارة')
    .reduce((sum, item) => sum + item.amount, 0);

  const emergencySaved = savings
    .filter(item => item.category === 'صندوق طوارئ')
    .reduce((sum, item) => sum + item.amount, 0);

  const balloonProgressPct = Math.round((carBalloonSaved / carBalloonTarget) * 100);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-[var(--ink)] text-base sm:text-lg">الباب الخامس: الادخار وبناء الأصول</h2>
            <span className="label-mono text-[10px] text-[var(--accent)] bg-[var(--accent-glow)] px-2.5 py-0.5 rounded-full border border-[var(--accent)]/30 font-bold">
              ISOLATED ASSETS
            </span>
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            المبالغ المحولة للادخار والاستثمار لا تختلط نهائياً بالمصروف اليومي
          </p>
        </div>

        {!isReadOnlySimulation ? (
          <button
            onClick={onOpenAddModal}
            className="btn btn-primary text-xs sm:text-sm py-2 px-4 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إيداع ادخار جديد</span>
          </button>
        ) : (
          <span className="text-xs text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl font-bold">
            وضع المحاكاة (قراءة فقط) 🔒
          </span>
        )}
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel p-4.5 flex items-center justify-between border-[rgba(16,185,129,0.35)]!">
          <div>
            <span className="label-mono font-bold">إجمالي المدخرات المحققة</span>
            <p className="text-xl font-bold font-mono text-[var(--accent)] num-ltr mt-1">
              {formatCurrency(totalSaved)} <small className="text-xs text-[var(--ink-muted)] font-sans">ر.س</small>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-glow)] border border-[var(--accent)] text-[var(--accent)] flex items-center justify-center">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4.5 flex items-center justify-between border-[rgba(129,140,248,0.35)]!">
          <div>
            <span className="label-mono text-blue-400 font-bold">صندوق الطوارئ المحمي</span>
            <p className="text-xl font-bold font-mono text-blue-400 num-ltr mt-1">
              {formatCurrency(emergencySaved)} <small className="text-xs text-[var(--ink-muted)] font-sans">ر.س</small>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[rgba(99,102,241,0.15)] border border-[var(--indigo)] text-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4.5 flex flex-col justify-between border-[rgba(251,191,36,0.35)]!">
          <div className="flex items-center justify-between">
            <span className="label-mono text-amber-400 font-bold">مخصص دفعة السيارة (37k)</span>
            <span className="label-mono text-[10px] text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 num-ltr font-bold">
              {balloonProgressPct}% TARGET
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-amber-400 num-ltr mt-1">
            {formatCurrency(carBalloonSaved)} <small className="text-xs text-[var(--ink-muted)] font-sans">ر.س</small>
          </p>
          <div className="w-full bg-[rgba(255,255,255,0.08)] rounded-full h-2 mt-2.5 overflow-hidden border border-[var(--glass-border)]">
            <div className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(balloonProgressPct, 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Savings Ledger Table */}
      <div className="table-container glass-panel overflow-hidden">
        <div className="p-3.5 border-b border-[var(--glass-border)] flex items-center justify-between">
          <h3 className="font-extrabold text-[var(--ink)] text-xs sm:text-sm">سجل التحويل للادخار والأصول</h3>
          <span className="label-mono num-ltr font-bold text-[var(--accent)]">{savings.length} RECORDS</span>
        </div>

        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[var(--glass-border)] text-[var(--ink-muted)] bg-[var(--glass-thick)] backdrop-blur-md">
                <th className="p-3 font-semibold">بند الادخار</th>
                <th className="p-3 text-center font-semibold">التصنيف</th>
                <th className="p-3 text-center font-semibold">المبلغ المحول</th>
                <th className="p-3 text-center font-semibold">التاريخ</th>
                <th className="p-3 font-semibold">ملاحظات</th>
                <th className="p-3 text-center font-semibold">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)] text-[var(--ink)]">
              {savings.map((item) => (
                <tr key={item.id} className="hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                  <td className="p-3 font-medium flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>{item.title}</span>
                  </td>
                  <td className="p-3 text-center"><span className="label-mono text-[9px] bg-[var(--glass-thick)] px-2.5 py-0.5 rounded-full border border-[var(--glass-border)]">{item.category}</span></td>
                  <td className="p-3 text-center font-bold font-mono text-[var(--accent)] num-ltr whitespace-nowrap">
                    +{formatCurrency(item.amount)} <small className="text-[10px] text-[var(--ink-muted)]">ر.س</small>
                  </td>
                  <td className="p-3 text-center text-[11px] text-[var(--ink-muted)] font-mono num-ltr">{item.date}</td>
                  <td className="p-3 text-[11px] text-[var(--ink-muted)] max-w-xs truncate">{item.notes || '-'}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => onDeleteSavings(item.id)} className="cursor-pointer p-1 text-[var(--ink-muted)] hover:text-rose-400 transition" title="حذف">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
