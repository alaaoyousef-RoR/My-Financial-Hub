import React, { useState } from 'react';
import { LiabilityItem, ReceivableRecord } from '../types/finance';
import { formatCurrency, triggerCelebration } from '../utils/formatters';
import { 
  HandCoins, 
  CheckCircle, 
  Trash2, 
  Plus, 
  ShieldAlert, 
  ArrowUpRight, 
  RotateCcw,
  Coins
} from 'lucide-react';

interface LiabilitiesAndReceivablesProps {
  liabilities: LiabilityItem[];
  receivables: ReceivableRecord[];
  onAddLiability: (item: LiabilityItem) => void;
  onDeleteLiability: (id: string) => void;
  onAddReceivable: (name: string, amount: number, notes?: string) => void;
  onDeleteReceivable: (id: string) => void;
  onCollectReceivable: (id: string, destination: 'income' | 'bnpl_payoff' | 'savings') => void;
  onUncollectReceivable: (id: string) => void;
  onOpenAddLiabilityModal: () => void;
  onOpenAddReceivableModal: () => void;
  isReadOnlySimulation?: boolean;
}

export const LiabilitiesAndReceivablesView: React.FC<LiabilitiesAndReceivablesProps> = ({
  liabilities,
  receivables,
  onAddLiability,
  onDeleteLiability,
  onAddReceivable,
  onDeleteReceivable,
  onCollectReceivable,
  onUncollectReceivable,
  onOpenAddLiabilityModal,
  onOpenAddReceivableModal,
  isReadOnlySimulation = false
}) => {
  const [selectedReceivableToRoute, setSelectedReceivableToRoute] = useState<ReceivableRecord | null>(null);

  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
  const pendingReceivables = receivables.filter(r => r.status === 'معلق');
  const pendingReceivablesTotal = pendingReceivables.reduce((sum, item) => sum + item.amount, 0);

  const handleRouteConfirm = (destination: 'income' | 'bnpl_payoff' | 'savings') => {
    if (selectedReceivableToRoute) {
      onCollectReceivable(selectedReceivableToRoute.id, destination);
      setSelectedReceivableToRoute(null);
      triggerCelebration();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-[var(--ink)] text-base sm:text-lg">الباب السادس: الديون والمستحقات</h2>
            <span className="label-mono text-[10px] text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold">
              DEBTS & RECEIVABLES
            </span>
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            فصل صارم بين الالتزامات المؤجلة المستحقة عليك، وبين أموالك المعلقة لدى الغير بالسوق
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddLiabilityModal}
            className="btn btn-ghost text-xs py-1.5 px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل دين عليك</span>
          </button>

          <button
            onClick={onOpenAddReceivableModal}
            className="btn btn-primary text-xs py-1.5 px-3 bg-amber-400! hover:bg-amber-300!"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل مستحق لك</span>
          </button>
        </div>
      </div>

      {/* 2 Big Sections: [الديون المؤجلة عليك] vs [أموالك المعلقة لدى الغير] */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Liabilities */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[rgba(255,77,77,0.15)] border border-[rgba(255,77,77,0.3)] text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-[var(--ink)] text-sm">الديون المؤجلة المستحقة عليك</h3>
                <p className="text-[11px] text-[var(--ink-muted)]">التزامات تدفع مستقبلاً (مثل دفعة السيارة الأخيرة)</p>
              </div>
            </div>
          </div>

          <div className="bg-[rgba(255,77,77,0.08)] border border-[var(--danger)]/30 p-3 rounded-xl flex items-center justify-between">
            <span className="label-mono text-rose-400 font-bold">إجمالي الالتزامات المؤجلة:</span>
            <span className="text-lg font-bold font-mono text-[var(--danger)] num-ltr">
              {formatCurrency(totalLiabilities)} <small className="text-xs text-[var(--ink-muted)]">ر.س</small>
            </span>
          </div>

          <div className="space-y-2">
            {liabilities.map((item) => (
              <div 
                key={item.id} 
                className="p-3.5 rounded-xl border border-[var(--glass-border)] bg-[rgba(0,0,0,0.25)] space-y-2 transition hover:border-[var(--glass-border-hover)]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[var(--ink)]">{item.title}</h4>
                    <span className="text-[11px] text-[var(--ink-muted)] block mt-0.5">
                      الاستحقاق: <strong className="num-ltr font-mono text-white">{item.dueDate}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-[var(--danger)] text-sm num-ltr">
                      {formatCurrency(item.amount)} <small className="text-[10px] text-[var(--ink-muted)]">ر.س</small>
                    </span>
                    <button
                      onClick={() => onDeleteLiability(item.id)}
                      className="cursor-pointer p-1.5 text-[var(--ink-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.notes && (
                  <p className="text-[11px] text-[var(--ink-muted)] bg-[rgba(255,255,255,0.03)] p-2 rounded-lg border border-[var(--glass-border)]">
                    {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 2. Receivables */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[var(--warning)] flex items-center justify-center">
                <HandCoins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-[var(--ink)] text-sm">أموالك المعلقة لدى الغير (ديون السوق)</h3>
                <p className="text-[11px] text-[var(--ink-muted)]">مستحقات معلقة لم يتم تحصيلها بعد</p>
              </div>
            </div>
          </div>

          <div className="bg-[rgba(251,191,36,0.08)] border border-amber-500/30 p-3 rounded-xl flex items-center justify-between">
            <span className="label-mono text-amber-400 font-bold">إجمالي ديون السوق المعلقة:</span>
            <span className="text-lg font-bold font-mono text-amber-400 num-ltr">
              {formatCurrency(pendingReceivablesTotal)} <small className="text-xs text-[var(--ink-muted)]">ر.س</small>
            </span>
          </div>

          <div className="space-y-2">
            {receivables.map((item) => {
              const isCollected = item.status === 'تم التحصيل';

              return (
                <div 
                  key={item.id} 
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                    isCollected 
                      ? 'bg-[rgba(16,185,129,0.04)] border-[var(--accent)]/30 opacity-70' 
                      : 'bg-[rgba(0,0,0,0.25)] border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-[var(--ink)]">{item.name}</span>
                      <span className={`label-mono text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        isCollected ? 'text-[var(--accent)] bg-[var(--accent-glow)] border border-[var(--accent)]/30' : 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    {item.notes && <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">{item.notes}</p>}
                    {isCollected && item.routedTo && (
                      <span className="text-[10px] text-[var(--accent)] block mt-0.5">
                        ✓ وُجّه إلى: {
                          item.routedTo === 'income' ? 'الإيرادات' :
                          item.routedTo === 'bnpl_payoff' ? 'سداد الأقساط' : 'ادخار السيارة'
                        }
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="font-bold font-mono text-[var(--ink)] text-sm num-ltr">
                      {formatCurrency(item.amount)} <small className="text-[10px] text-[var(--ink-muted)]">ر.س</small>
                    </span>

                    {isCollected ? (
                      <button
                        onClick={() => onUncollectReceivable(item.id)}
                        className="cursor-pointer text-[11px] bg-[var(--glass-thick)] text-[var(--ink-muted)] hover:text-white px-2.5 py-1 rounded-lg border border-[var(--glass-border)] transition"
                        title="تراجع"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedReceivableToRoute(item)}
                        className="btn btn-primary text-[11px] py-1 px-3 shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5 inline ml-1" />
                        <span>تحصيل</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteReceivable(item.id)}
                      className="cursor-pointer p-1.5 text-[var(--ink-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Modal / Dialog for Routing Collected Money */}
      {selectedReceivableToRoute && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--ink)] text-sm">توجيه وتخصيص المبلغ المحصل</h3>
                <p className="text-xs text-[var(--ink-muted)]">{formatCurrency(selectedReceivableToRoute.amount)} ر.س من {selectedReceivableToRoute.name}</p>
              </div>
            </div>

            <p className="text-xs text-[var(--ink-muted)]">
              اختر الوجهة المحاسبية لإيداع هذا المبلغ في ميزانيتك:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleRouteConfirm('bnpl_payoff')}
                className="cursor-pointer w-full p-3 rounded border border-[var(--indigo)]/40 hover:bg-[var(--indigo)]/10 text-right transition flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-[var(--indigo)] block">1. سداد أقساط تمارا وتابي مبكراً (موصى به)</span>
                  <span className="text-[11px] text-[var(--ink-muted)]">لتحرير السيولة الشهرية فوراً</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--indigo)]" />
              </button>

              <button
                onClick={() => handleRouteConfirm('savings')}
                className="cursor-pointer w-full p-3 rounded border border-[var(--accent)]/40 hover:bg-[var(--accent-glow)] text-right transition flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-[var(--accent)] block">2. إيداع في مخصص الدفعة الأخيرة للسيارة (37k)</span>
                  <span className="text-[11px] text-[var(--ink-muted)]">لتجميع المبلغ بأمان قبل حلول الأجل</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--accent)]" />
              </button>

              <button
                onClick={() => handleRouteConfirm('income')}
                className="cursor-pointer w-full p-3 rounded border border-[var(--ink-faint)] hover:bg-[var(--surface-hover)] text-right transition flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-[var(--ink)] block">3. إضافة إلى إيرادات هذا الشهر</span>
                  <span className="text-[11px] text-[var(--ink-muted)]">كإيراد نقدي عام</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--ink-muted)]" />
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedReceivableToRoute(null)}
                className="cursor-pointer px-3 py-1.5 border border-[var(--ink-faint)] rounded text-[var(--ink-muted)] text-xs hover:text-white"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
