import React, { useState } from 'react';
import { IncomeItem, FixedObligation, CarPlan } from '../types/finance';
import { formatCurrency, triggerCelebration } from '../utils/formatters';
import { 
  Banknote, 
  Car, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X
} from 'lucide-react';

interface IncomeAndFixedProps {
  incomes: IncomeItem[];
  fixedObligations: FixedObligation[];
  carPlan: CarPlan;
  onUpdateIncomes: (incomes: IncomeItem[]) => void;
  onUpdateFixed: (fixed: FixedObligation[]) => void;
  onUpdateCarPlan: (car: CarPlan) => void;
  onOpenAddIncomeModal: () => void;
  onOpenAddFixedModal: () => void;
  isReadOnlySimulation?: boolean;
}

export const IncomeAndFixedSection: React.FC<IncomeAndFixedProps> = ({
  incomes,
  fixedObligations,
  carPlan,
  onUpdateIncomes,
  onUpdateFixed,
  onUpdateCarPlan,
  onOpenAddIncomeModal,
  onOpenAddFixedModal,
  isReadOnlySimulation = false
}) => {
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [carForm, setCarForm] = useState<CarPlan>({ ...carPlan });

  const totalMonthlyIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalFixedObligations = fixedObligations.reduce((sum, item) => sum + item.amount, 0);

  const carProgressPct = Math.round((carPlan.paidInstallments / carPlan.totalInstallments) * 100);
  const carRemainingInstallments = carPlan.totalInstallments - carPlan.paidInstallments;
  const carRemainingRegularAmount = carRemainingInstallments * carPlan.monthlyInstallment;
  const carTotalRemainingWithBalloon = carRemainingRegularAmount + carPlan.balloonPayment;

  const handleSaveCar = () => {
    onUpdateCarPlan(carForm);
    setIsEditingCar(false);
  };

  const incrementCarMonth = () => {
    if (carPlan.paidInstallments < carPlan.totalInstallments) {
      const updated = { ...carPlan, paidInstallments: carPlan.paidInstallments + 1 };
      onUpdateCarPlan(updated);
      triggerCelebration();
    }
  };

  const deleteIncome = (id: string) => {
    if (incomes.length <= 1) {
      return;
    }
    onUpdateIncomes(incomes.filter(i => i.id !== id));
  };

  const deleteFixed = (id: string) => {
    onUpdateFixed(fixedObligations.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      
      {/* 1. CAR FINANCING TRACKER WIDGET */}
      <div className="glass-panel p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[var(--glass-border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(99,102,241,0.15)] border border-[var(--indigo)] flex items-center justify-center text-blue-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-[var(--ink)]">خطة تمويل وأقساط السيارة (الـ 60 شهراً)</h3>
                <span className="label-mono text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 num-ltr font-bold">
                  {carProgressPct}% COMPLETED
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                متبقي {carRemainingInstallments} شهراً حتى موعد الدفعة الأخيرة (37,000 ريال)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnlySimulation ? (
              !isEditingCar ? (
                <>
                  <button
                    onClick={incrementCarMonth}
                    className="btn btn-primary text-xs py-1.5 px-3"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>سداد قسط (+1 شهر)</span>
                  </button>
                  <button
                    onClick={() => {
                      setCarForm({ ...carPlan });
                      setIsEditingCar(true);
                    }}
                    className="btn btn-ghost text-xs py-1.5 px-2.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={handleSaveCar} className="btn btn-primary text-xs py-1 px-3">
                    <Check className="w-3.5 h-3.5" /> حفظ
                  </button>
                  <button onClick={() => setIsEditingCar(false)} className="btn btn-ghost text-xs py-1 px-3">
                    <X className="w-3.5 h-3.5" /> إلغاء
                  </button>
                </div>
              )
            ) : (
              <span className="text-xs text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-xl font-bold">
                وضع المحاكاة (قراءة فقط)
              </span>
            )}
          </div>
        </div>

        {/* Edit fields if open */}
        {isEditingCar && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[rgba(0,0,0,0.3)] p-3 rounded-xl mt-3 border border-[var(--glass-border)] text-xs">
            <div>
              <label className="label-mono block mb-1">القسط الشهري (ر.س)</label>
              <input
                type="number"
                value={carForm.monthlyInstallment}
                onChange={(e) => setCarForm({ ...carForm, monthlyInstallment: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#09090b] border border-[var(--glass-border)] rounded-lg p-1.5 text-white font-mono num-ltr"
              />
            </div>
            <div>
              <label className="label-mono block mb-1">الأقساط المسددة</label>
              <input
                type="number"
                value={carForm.paidInstallments}
                onChange={(e) => setCarForm({ ...carForm, paidInstallments: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#09090b] border border-[var(--glass-border)] rounded-lg p-1.5 text-white font-mono num-ltr"
              />
            </div>
            <div>
              <label className="label-mono block mb-1">إجمالي الأقساط</label>
              <input
                type="number"
                value={carForm.totalInstallments}
                onChange={(e) => setCarForm({ ...carForm, totalInstallments: parseInt(e.target.value) || 60 })}
                className="w-full bg-[#09090b] border border-[var(--glass-border)] rounded-lg p-1.5 text-white font-mono num-ltr"
              />
            </div>
            <div>
              <label className="label-mono block mb-1">الدفعة الأخيرة (ر.س)</label>
              <input
                type="number"
                value={carForm.balloonPayment}
                onChange={(e) => setCarForm({ ...carForm, balloonPayment: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#09090b] border border-[var(--glass-border)] rounded-lg p-1.5 text-white font-mono num-ltr"
              />
            </div>
          </div>
        )}

        {/* Progress Visual Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--ink-muted)]">تم سداد <strong className="text-[var(--ink)] font-mono"><span className="num-ltr">{carPlan.paidInstallments}</span></strong> من أصل <strong className="text-[var(--ink)] font-mono"><span className="num-ltr">{carPlan.totalInstallments}</span></strong> قسطاً</span>
            <span className="text-amber-400 font-mono"><span className="num-ltr">{carRemainingInstallments}</span> شهراً متبقية</span>
          </div>

          <div className="w-full h-2.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden p-0.5 border border-[var(--glass-border)]">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(carProgressPct, 100)}%`,
                background: 'linear-gradient(90deg, var(--accent), var(--indigo))'
              }}
            ></div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--glass-border)] text-xs">
          <div className="bg-[rgba(0,0,0,0.25)] p-3 rounded-xl border border-[var(--glass-border)]">
            <span className="label-mono block">القسط الشهري</span>
            <span className="text-sm font-bold font-mono text-[var(--ink)] num-ltr mt-0.5 block">
              {formatCurrency(carPlan.monthlyInstallment)} <small className="text-[10px] text-[var(--ink-muted)]">ر.س</small>
            </span>
          </div>

          <div className="bg-[rgba(0,0,0,0.25)] p-3 rounded-xl border border-[var(--glass-border)]">
            <span className="label-mono block">المتبقي من الأقساط</span>
            <span className="text-sm font-bold font-mono text-blue-400 num-ltr mt-0.5 block">
              {formatCurrency(carRemainingRegularAmount)} <small className="text-[10px] text-[var(--ink-muted)]">ر.س</small>
            </span>
          </div>

          <div className="bg-[rgba(0,0,0,0.25)] p-3 rounded-xl border border-[var(--glass-border)]">
            <span className="label-mono block">الدفعة الأخيرة (Balloon)</span>
            <span className="text-sm font-bold font-mono text-amber-400 num-ltr mt-0.5 block">
              {formatCurrency(carPlan.balloonPayment)} <small className="text-[10px] text-[var(--ink-muted)]">ر.س</small>
            </span>
          </div>

          <div className="bg-[rgba(0,0,0,0.25)] p-3 rounded-xl border border-[var(--glass-border)]">
            <span className="label-mono block">إجمالي تصفية السيارة</span>
            <span className="text-sm font-bold font-mono text-rose-400 num-ltr mt-0.5 block">
              {formatCurrency(carTotalRemainingWithBalloon)} <small className="text-[10px] text-[var(--ink-muted)]">ر.س</small>
            </span>
          </div>
        </div>
      </div>

      {/* 2 Columns: Income vs Fixed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Income Card */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] border border-[var(--accent)] text-[var(--accent)] flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-[var(--ink)] text-sm">الباب الأول: الإيرادات والدخل</h3>
                <p className="text-[11px] text-[var(--ink-muted)]">الراتب ومصادر الدخل النشطة</p>
              </div>
            </div>

            {!isReadOnlySimulation && (
              <button
                onClick={onOpenAddIncomeModal}
                className="btn btn-ghost text-xs py-1.5 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة دخل</span>
              </button>
            )}
          </div>

          <div className="bg-[rgba(16,185,129,0.08)] border border-[var(--accent)]/30 p-3 rounded-xl flex items-center justify-between">
            <span className="label-mono text-[var(--accent)] font-bold">إجمالي الدخل الشهري:</span>
            <span className="text-lg font-bold font-mono text-[var(--accent)] num-ltr">
              {formatCurrency(totalMonthlyIncome)} <small className="text-xs text-[var(--ink-muted)]">ر.س</small>
            </span>
          </div>

          <div className="space-y-2">
            {incomes.map((item) => (
              <div 
                key={item.id} 
                className="p-3 rounded-xl border border-[var(--glass-border)] bg-[rgba(0,0,0,0.25)] flex items-center justify-between transition hover:border-[var(--glass-border-hover)]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-[var(--ink)]">{item.title}</span>
                    <span className="label-mono text-[9px] text-[var(--accent)] bg-[var(--accent-glow)] px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                  {item.notes && <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">{item.notes}</p>}
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="font-bold font-mono text-[var(--ink)] text-sm num-ltr">
                    {formatCurrency(item.amount)} <small className="text-[10px] text-[var(--ink-muted)]">ر.س</small>
                  </span>
                  <button
                    onClick={() => deleteIncome(item.id)}
                    className="cursor-pointer p-1 text-[var(--ink-muted)] hover:text-[var(--danger)] transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Obligations Card */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[rgba(99,102,241,0.15)] border border-[var(--indigo)] text-blue-400 flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-[var(--ink)] text-sm">الباب الثاني: الالتزامات الثابتة (Fixed)</h3>
                <p className="text-[11px] text-[var(--ink-muted)]">السيارة، السكن، والبنزين</p>
              </div>
            </div>

            {!isReadOnlySimulation && (
              <button
                onClick={onOpenAddFixedModal}
                className="btn btn-ghost text-xs py-1.5 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة التزام</span>
              </button>
            )}
          </div>

          <div className="bg-[rgba(99,102,241,0.08)] border border-blue-500/30 p-3 rounded-xl flex items-center justify-between">
            <span className="label-mono text-blue-400 font-bold">إجمالي الثوابت شهرياً:</span>
            <span className="text-lg font-bold font-mono text-blue-400 num-ltr">
              {formatCurrency(totalFixedObligations)} <small className="text-xs text-[var(--ink-muted)]">ر.س</small>
            </span>
          </div>

          <div className="space-y-2">
            {fixedObligations.map((item) => (
              <div 
                key={item.id} 
                className="p-3 rounded-xl border border-[var(--glass-border)] bg-[rgba(0,0,0,0.25)] flex items-center justify-between transition hover:border-[var(--glass-border-hover)]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-[var(--ink)]">{item.title}</span>
                    <span className="label-mono text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                  {item.notes && <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">{item.notes}</p>}
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="font-bold font-mono text-[var(--ink)] text-sm num-ltr">
                    {formatCurrency(item.amount)} <small className="text-[10px] text-[var(--ink-muted)]">ر.س</small>
                  </span>
                  <button
                    onClick={() => deleteFixed(item.id)}
                    className="cursor-pointer p-1 text-[var(--ink-muted)] hover:text-[var(--danger)] transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
