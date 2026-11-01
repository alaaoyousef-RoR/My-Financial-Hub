import React, { useState, useMemo } from 'react';
import { MonthlyRecord, InstallmentRecord } from '../types/finance';
import { useFinancialState } from '../context/FinancialContext';
import { formatCurrency, triggerCelebration } from '../utils/formatters';
import { 
  Sparkles, 
  Edit3, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  TableProperties,
  ShieldCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export interface MonthlyCashFlowRow {
  id: string;
  month: string;
  isCurrentMonth: boolean;
  salary: number;
  car: number;
  home: number;
  gas: number;
  tamara: number;
  tabby: number;
  totalCommitments: number;
  netBalance: number;
  actualSpent?: number;
  statusBadge: {
    label: string;
    type: 'current' | 'free' | 'surplus' | 'deficit' | 'milestone';
  };
  milestoneTag?: string;
  note?: string;
}

interface CashFlowTableProps {
  monthlyData?: MonthlyRecord[];
  onUpdateMonth?: (updated: MonthlyRecord) => void;
  onAddMonth?: (newMonth: MonthlyRecord) => void;
  onDeleteMonth?: (id: string) => void;
  defaultExpanded?: boolean;
}

export const CashFlowTable: React.FC<CashFlowTableProps> = ({
  monthlyData: propMonthlyData,
  onUpdateMonth: propOnUpdateMonth,
  onAddMonth: propOnAddMonth,
  onDeleteMonth: propOnDeleteMonth,
  defaultExpanded = true
}) => {
  // Access centralized state from FinancialContext
  const financial = useFinancialState();

  const monthlyData = propMonthlyData || financial.monthlyData;
  const onUpdateMonth = propOnUpdateMonth || financial.updateMonth;
  const onAddMonth = propOnAddMonth || financial.addMonth;
  const onDeleteMonth = propOnDeleteMonth || financial.deleteMonth;

  // Collapsible table state
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MonthlyRecord | null>(null);

  const startEdit = (row: MonthlyCashFlowRow) => {
    setEditingId(row.id);
    setEditForm({
      id: row.id,
      month: row.month,
      salary: row.salary,
      car: row.car,
      home: row.home,
      gas: row.gas,
      tamara: row.tamara,
      tabby: row.tabby,
      note: row.note
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (editForm) {
      onUpdateMonth(editForm);
      setEditingId(null);
      setEditForm(null);
      triggerCelebration();
    }
  };

  // ==========================================
  // SMART DERIVED PROJECTION ENGINE
  // ==========================================
  const derivedRows: MonthlyCashFlowRow[] = useMemo(() => {
    const { 
      incomes, 
      carPlan, 
      fixedObligations, 
      installments, 
      totalPersonalExpenses,
      totalIncome 
    } = financial;

    const baseSalary = totalIncome > 0 ? totalIncome : 5000;
    const baseHome = fixedObligations.find(f => f.category === 'سكن وإيجار')?.amount ?? 500;
    const baseGas = fixedObligations.find(f => f.category === 'بنزين وتشغيل')?.amount ?? 600;

    // Active Tamara & Tabby installments
    const tamaraPlans = installments.filter(i => i.platform === 'Tamara' && i.status === 'active');
    const tabbyPlans = installments.filter(i => i.platform === 'Tabby' && i.status === 'active');

    return monthlyData.map((record, index) => {
      const isCurrentMonth = index === 0;

      // 1. Dynamic Salary
      const salary = record.salary > 0 ? record.salary : baseSalary;

      // 2. Dynamic Car Loan (steps down when total installments fulfilled)
      const carInstallmentsCompleted = carPlan.paidInstallments + index;
      const car = carInstallmentsCompleted < carPlan.totalInstallments 
        ? carPlan.monthlyInstallment 
        : 0;

      // 3. Dynamic Fixed Obligations (Rent & Fuel)
      const home = record.home > 0 ? record.home : baseHome;
      const gas = record.gas > 0 ? record.gas : baseGas;

      // 4. Dynamic BNPL Installments (Step-down simulation based on remainingMonths)
      let tamara = 0;
      let tabby = 0;

      if (isCurrentMonth) {
        // Current month: sum active installments
        tamara = tamaraPlans.reduce((sum, p) => sum + p.amount, 0);
        tabby = tabbyPlans.reduce((sum, p) => sum + p.amount, 0);
      } else {
        // Future projection months (index >= 1):
        // Each plan steps down to 0 after remainingMonths expires
        tamara = tamaraPlans.reduce((sum, p) => {
          const effectiveMonthsLeft = p.isPaidThisMonth ? p.remainingMonths : Math.max(p.remainingMonths - 1, 0);
          return index <= effectiveMonthsLeft ? sum + p.amount : sum;
        }, 0);

        tabby = tabbyPlans.reduce((sum, p) => {
          const effectiveMonthsLeft = p.isPaidThisMonth ? p.remainingMonths : Math.max(p.remainingMonths - 1, 0);
          return index <= effectiveMonthsLeft ? sum + p.amount : sum;
        }, 0);
      }

      // If user manually edited this record in history and wants manual override, use it if positive
      if (record.tamara !== undefined && record.tamara !== tamara && record.note?.includes('تعديل يدوي')) {
        tamara = record.tamara;
      }
      if (record.tabby !== undefined && record.tabby !== tabby && record.note?.includes('تعديل يدوي')) {
        tabby = record.tabby;
      }

      // 5. Total Commitments calculation
      const totalCommitments = car + home + gas + tamara + tabby;

      // 6. Net Balance calculation
      // For current month, also factor in actual recorded personal expenses
      const actualSpent = isCurrentMonth ? totalPersonalExpenses : 0;
      const netBalance = salary - totalCommitments - actualSpent;

      // 7. Milestone & Status Badge Detection
      const isZeroDebt = tamara === 0 && tabby === 0;
      let statusBadge: MonthlyCashFlowRow['statusBadge'] = {
        label: 'فائض ممتاز',
        type: 'surplus'
      };
      let milestoneTag: string | undefined = undefined;

      if (isCurrentMonth) {
        statusBadge = {
          label: 'الشهر الحالي ⚡',
          type: 'current'
        };
      } else if (isZeroDebt) {
        statusBadge = {
          label: 'Zero Debt ✨',
          type: 'free'
        };
        milestoneTag = 'التحرر الكامل من الأقساط 🎉';
      } else if (netBalance < 0) {
        statusBadge = {
          label: 'عجز مالي / حرج',
          type: 'deficit'
        };
      } else if (tamara === 0 && tabby > 0) {
        statusBadge = {
          label: 'تحرر من تمارا',
          type: 'milestone'
        };
        milestoneTag = 'تمارا = 0 ر.س';
      } else if (tabby === 0 && tamara > 0) {
        statusBadge = {
          label: 'تحرر من تابي',
          type: 'milestone'
        };
        milestoneTag = 'تابي = 0 ر.س';
      }

      return {
        id: record.id,
        month: record.month,
        isCurrentMonth,
        salary,
        car,
        home,
        gas,
        tamara,
        tabby,
        totalCommitments,
        netBalance,
        actualSpent,
        statusBadge,
        milestoneTag,
        note: record.note
      };
    });
  }, [monthlyData, financial]);

  // Aggregate Totals for Summary Strip
  const totalSalaries = derivedRows.reduce((acc, m) => acc + m.salary, 0);
  const totalCommitmentsSum = derivedRows.reduce((acc, m) => acc + m.totalCommitments, 0);
  const totalNet = derivedRows.reduce((acc, m) => acc + m.netBalance, 0);

  return (
    <div className="glass-panel overflow-hidden rounded-2xl border border-slate-800/80 bg-[rgba(15,23,42,0.65)] font-['Readex_Pro',sans-serif] shadow-lg">
      
      {/* Header bar with collapsible toggle */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/50">
        <button
          type="button"
          onClick={() => setIsExpanded(prev => !prev)}
          className="flex items-center gap-3 text-right cursor-pointer select-none group w-full sm:w-auto"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <TableProperties className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-[var(--ink)] text-sm sm:text-base group-hover:text-emerald-400 transition-colors">
                جدول التدفق المالي والأقساط الشهرية (Dynamic Projection Engine)
              </h2>
              <span className="label-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold hidden sm:inline-block">
                {derivedRows.length} شهراً مخططاً
              </span>
            </div>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
              محرك حساب ديناميكي: تراجع تلقائي لأقساط تمارا وتابي، ونمو للصافي المتاح حتى التحرر المالي التام
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="label-mono text-[10px] text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>APR-27 ZERO DEBT</span>
          </span>

          <button
            onClick={() => {
              const last = monthlyData[monthlyData.length - 1];
              const newMonth: MonthlyRecord = {
                id: `m-${Date.now()}`,
                month: 'شهر جديد',
                salary: last ? last.salary : 5000,
                car: 0,
                home: 500,
                gas: 600,
                tamara: 0,
                tabby: 0,
                note: 'أفق زمني إضافي'
              };
              onAddMonth(newMonth);
            }}
            className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 shadow-xs"
            title="إضافة شهر جديد للجدول"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ شهر</span>
          </button>

          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--ink-muted)] hover:text-white transition"
            title={isExpanded ? 'طي الجدول' : 'توسيع الجدول'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="animate-fadeIn">
          
          {/* Responsive HTML Table Container with horizontal scrolling */}
          <div className="w-full overflow-x-auto custom-scroll">
            <table className="w-full text-right text-xs whitespace-nowrap border-collapse" style={{ minWidth: '980px' }}>
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300 font-bold label-mono text-[11px]">
                  <th className="py-3 px-4 text-right min-w-[130px]">الشهر (Month)</th>
                  <th className="py-3 px-3 text-center min-w-[90px]">الراتب (Income)</th>
                  <th className="py-3 px-3 text-center min-w-[90px]">السيارة (Car)</th>
                  <th className="py-3 px-3 text-center min-w-[85px]">السكن (Rent)</th>
                  <th className="py-3 px-3 text-center min-w-[85px]">البنزين (Fuel)</th>
                  <th className="py-3 px-3 text-center text-rose-400 min-w-[95px]">تمارا (Tamara)</th>
                  <th className="py-3 px-3 text-center text-emerald-400 min-w-[95px]">تابي (Tabby)</th>
                  <th className="py-3 px-3.5 text-center text-slate-200 min-w-[110px]">إجمالي الالتزامات</th>
                  <th className="py-3 px-3.5 text-center text-emerald-400 min-w-[115px]">الصافي المتاح (Net)</th>
                  <th className="py-3 px-4 text-center min-w-[150px]">حالة الشهر (Status)</th>
                  <th className="py-3 px-3 text-center min-w-[75px]">إجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 text-[var(--ink)]">
                {derivedRows.map((row) => {
                  const isEditing = editingId === row.id;

                  // 1. Inline Edit Mode Row
                  if (isEditing && editForm) {
                    return (
                      <tr key={row.id} className="bg-slate-800/50">
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={editForm.month}
                            onChange={(e) => setEditForm({ ...editForm, month: e.target.value })}
                            className="w-24 bg-[#09090b] border border-emerald-500 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            value={editForm.salary}
                            onChange={(e) => setEditForm({ ...editForm, salary: parseFloat(e.target.value) || 0 })}
                            className="w-20 bg-[#09090b] border border-emerald-500 rounded-lg px-2 py-1 text-xs text-center font-mono num-ltr text-white"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            value={editForm.car}
                            onChange={(e) => setEditForm({ ...editForm, car: parseFloat(e.target.value) || 0 })}
                            className="w-18 bg-[#09090b] border border-emerald-500 rounded-lg px-2 py-1 text-xs text-center font-mono num-ltr text-white"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            value={editForm.home}
                            onChange={(e) => setEditForm({ ...editForm, home: parseFloat(e.target.value) || 0 })}
                            className="w-16 bg-[#09090b] border border-emerald-500 rounded-lg px-2 py-1 text-xs text-center font-mono num-ltr text-white"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            value={editForm.gas}
                            onChange={(e) => setEditForm({ ...editForm, gas: parseFloat(e.target.value) || 0 })}
                            className="w-16 bg-[#09090b] border border-emerald-500 rounded-lg px-2 py-1 text-xs text-center font-mono num-ltr text-white"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.tamara}
                            onChange={(e) => setEditForm({ ...editForm, tamara: parseFloat(e.target.value) || 0 })}
                            className="w-20 bg-[#09090b] border border-rose-500 rounded-lg px-2 py-1 text-xs text-center font-mono num-ltr text-rose-400"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.tabby}
                            onChange={(e) => setEditForm({ ...editForm, tabby: parseFloat(e.target.value) || 0 })}
                            className="w-20 bg-[#09090b] border border-emerald-500 rounded-lg px-2 py-1 text-xs text-center font-mono num-ltr text-emerald-400"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono num-ltr text-slate-400">
                          {formatCurrency(editForm.car + editForm.home + editForm.gas + editForm.tamara + editForm.tabby)}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono num-ltr text-emerald-400 font-bold">
                          {formatCurrency(editForm.salary - (editForm.car + editForm.home + editForm.gas + editForm.tamara + editForm.tabby))}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            placeholder="ملاحظات..."
                            value={editForm.note || ''}
                            onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                            className="w-full bg-[#09090b] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={saveEdit} 
                              className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded cursor-pointer transition"
                              title="حفظ"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={cancelEdit} 
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded cursor-pointer transition"
                              title="إلغاء"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // 2. Standard Display Row
                  const isZeroDebt = row.tamara === 0 && row.tabby === 0;

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        row.isCurrentMonth
                          ? 'bg-blue-500/10 font-medium'
                          : isZeroDebt
                            ? 'bg-emerald-500/[0.04]'
                            : ''
                      }`}
                    >
                      {/* Month Label with Milestone */}
                      <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {row.isCurrentMonth && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                          )}
                          {isZeroDebt && !row.isCurrentMonth && (
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span className={row.isCurrentMonth ? 'text-blue-300 font-extrabold' : isZeroDebt ? 'text-emerald-300 font-extrabold' : ''}>
                            {row.month}
                          </span>
                        </div>
                      </td>

                      {/* Income / Salary */}
                      <td className="py-3 px-3 text-center font-mono num-ltr text-slate-100 font-semibold">
                        {formatCurrency(row.salary)}
                      </td>

                      {/* Car Loan */}
                      <td className="py-3 px-3 text-center font-mono num-ltr text-slate-300">
                        {row.car > 0 ? formatCurrency(row.car) : <span className="text-emerald-400 font-bold">0.00 ✓</span>}
                      </td>

                      {/* Rent */}
                      <td className="py-3 px-3 text-center font-mono num-ltr text-slate-300">
                        {formatCurrency(row.home)}
                      </td>

                      {/* Fuel */}
                      <td className="py-3 px-3 text-center font-mono num-ltr text-slate-300">
                        {formatCurrency(row.gas)}
                      </td>

                      {/* Tamara */}
                      <td className="py-3 px-3 text-center font-mono num-ltr font-bold">
                        {row.tamara > 0 ? (
                          <span className="text-rose-400">{formatCurrency(row.tamara)}</span>
                        ) : (
                          <span className="text-emerald-400/90 text-[11px] font-bold">0.00 (متحرر)</span>
                        )}
                      </td>

                      {/* Tabby */}
                      <td className="py-3 px-3 text-center font-mono num-ltr font-bold">
                        {row.tabby > 0 ? (
                          <span className="text-rose-400">{formatCurrency(row.tabby)}</span>
                        ) : (
                          <span className="text-emerald-400/90 text-[11px] font-bold">0.00 (متحرر)</span>
                        )}
                      </td>

                      {/* Total Commitments */}
                      <td className="py-3 px-3.5 text-center font-mono num-ltr font-black text-rose-300">
                        {formatCurrency(row.totalCommitments)}
                      </td>

                      {/* Net Available Balance */}
                      <td className="py-3 px-3.5 text-center font-mono num-ltr font-black text-sm">
                        <span className={row.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {row.netBalance >= 0 ? `+${formatCurrency(row.netBalance)}` : formatCurrency(row.netBalance)}
                        </span>
                      </td>

                      {/* Month Status Badge */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <span className={`label-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                            row.statusBadge.type === 'current'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : row.statusBadge.type === 'free'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                                : row.statusBadge.type === 'milestone'
                                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                                  : row.statusBadge.type === 'deficit'
                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {row.statusBadge.label}
                          </span>

                          {row.milestoneTag && (
                            <span className="text-[10px] text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                              {row.milestoneTag}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 text-slate-400">
                          <button 
                            onClick={() => startEdit(row)} 
                            className="cursor-pointer p-1.5 hover:text-white hover:bg-white/10 rounded transition" 
                            title="تعديل صف الشهر"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onDeleteMonth(row.id)} 
                            className="cursor-pointer p-1.5 hover:text-rose-400 hover:bg-rose-500/10 rounded transition" 
                            title="حذف الشهر"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Summary Strip */}
          <div className="bg-slate-900/80 p-3.5 sm:p-4 border-t border-slate-800/80 flex flex-wrap justify-between items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-5 flex-wrap">
              <div>
                <span className="label-mono text-slate-400 ml-1">إجمالي الرواتب:</span> 
                <span className="num-ltr font-black text-white">{formatCurrency(totalSalaries)} ر.س</span>
              </div>
              <div>
                <span className="label-mono text-slate-400 ml-1">إجمالي الالتزامات:</span> 
                <span className="num-ltr font-black text-rose-300">{formatCurrency(totalCommitmentsSum)} ر.س</span>
              </div>
              <div>
                <span className="label-mono text-slate-400 ml-1">تراكمي الصافي المتاح:</span> 
                <span className={`num-ltr font-black ${totalNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalNet >= 0 ? '+' : ''}{formatCurrency(totalNet)} ر.س
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="label-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
                DYNAMIC PROJECTION ENGINE ACTIVE
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
