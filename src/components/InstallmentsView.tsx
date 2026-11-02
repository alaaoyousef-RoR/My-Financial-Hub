import React, { useState } from 'react';
import { InstallmentRecord, SettlementMethod } from '../types/finance';
import { formatCurrency, triggerCelebration } from '../utils/formatters';
import { useMonthContext } from '../context/MonthContext';
import { BNPLOverview } from './dashboard/BNPLOverview';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Layers, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Clock, 
  AlertCircle,
  ShoppingBag,
  CreditCard,
  Edit3,
  ExternalLink,
  Zap,
  ChevronDown,
  Calendar
} from 'lucide-react';

interface InstallmentsViewProps {
  installments: InstallmentRecord[];
  onAddClick: () => void;
  onEditInstallment?: (item: InstallmentRecord) => void;
  onDeleteInstallment: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onPayMonth?: (id: string, method?: SettlementMethod) => void;
  onUndoPayMonth?: (id: string) => void;
  isReadOnlySimulation?: boolean;
}

export const InstallmentsView: React.FC<InstallmentsViewProps> = ({
  installments,
  onAddClick,
  onEditInstallment,
  onDeleteInstallment,
  onToggleStatus,
  onPayMonth,
  onUndoPayMonth,
  isReadOnlySimulation = false
}) => {
  const monthContext = useMonthContext();
  const [viewMode, setViewMode] = useState<'schedule' | 'contracts'>('schedule');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'Tamara' | 'Tabby'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [payingInstallmentId, setPayingInstallmentId] = useState<string | null>(null);

  // Filtering logic
  const filtered = installments.filter((item) => {
    const matchesPlatform = platformFilter === 'all' || item.platform === platformFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPlatform && matchesStatus && matchesSearch;
  });

  // Calculate live financial summaries
  const activeInstallments = installments.filter(i => i.status === 'active');
  const tamaraTotal = activeInstallments
    .filter(i => i.platform === 'Tamara')
    .reduce((sum, i) => sum + i.amount, 0);

  const tabbyTotal = activeInstallments
    .filter(i => i.platform === 'Tabby')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalMonthlyCommitment = tamaraTotal + tabbyTotal;

  // Total cumulative remaining balance to be paid across all plans
  const totalRemainingDebt = installments
    .filter(i => i.status === 'active')
    .reduce((sum, i) => sum + (i.amount * Math.max(i.remainingMonths, 0)), 0);

  const completedCount = installments.filter(i => i.status === 'completed').length;

  return (
    <div className="space-y-6 font-['Readex_Pro',sans-serif]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-[var(--ink)] text-base sm:text-lg">الباب الثالث: أقساط تمارا وتابي (BNPL)</h2>
            <span className="label-mono text-[10px] text-rose-400 bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-500/30 font-bold">
              تتبع الأقساط التفاعلي
            </span>
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            محاكاة متعددة الأشهر لسداد أقساط تمارا وتابي مع خيارات السداد المباشر من الجاري، الخارجي، أو المسبق
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subview Mode Toggle */}
          <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('schedule')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                viewMode === 'schedule'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-[var(--ink-muted)] hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>محاكاة الأشهر</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('contracts')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                viewMode === 'contracts'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-[var(--ink-muted)] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>سجل العقود ({installments.length})</span>
            </button>
          </div>

          {!isReadOnlySimulation ? (
            <button
              onClick={onAddClick}
              className="btn btn-secondary text-xs sm:text-sm py-2 px-3 shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قسط</span>
            </button>
          ) : (
            <span className="text-xs text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl font-bold">
              وضع المحاكاة 🔒
            </span>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: Interactive Multi-Month Simulation */}
      {viewMode === 'schedule' && (
        <BNPLOverview
          simulation={monthContext.bnplSimulation}
          isCurrentMonth={!monthContext.isReadOnlySimulation}
          onPayInstallment={(id, method) => {
            if (onPayMonth) onPayMonth(id, method);
          }}
          onUndoPayInstallment={onUndoPayMonth}
          isReadOnlySimulation={isReadOnlySimulation}
        />
      )}

      {/* VIEW MODE 2: Contracts Registry & Detailed Management */}
      {viewMode === 'contracts' && (
        <div className="space-y-6">
          {/* 4 Dynamic Summary Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Monthly BNPL Commitments */}
            <div className="glass-panel p-4 flex items-center justify-between border-[rgba(255,77,77,0.35)]! hover:border-[var(--danger)] transition">
              <div>
                <span className="label-mono font-bold text-rose-400">إجمالي أقساط هذا الشهر</span>
                <p className="text-xl font-bold font-mono text-[var(--danger)] num-ltr mt-1">
                  {formatCurrency(totalMonthlyCommitment)} <small className="text-xs text-[var(--ink-muted)] font-sans">ر.س</small>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>

        {/* Tamara Monthly Total */}
        <div className="glass-panel border-rose-500/30 p-4 flex items-center justify-between">
          <div>
            <span className="label-mono text-rose-400 font-bold">أقساط تمارا (Tamara)</span>
            <p className="text-xl font-bold font-mono text-rose-400 num-ltr mt-1">
              {formatCurrency(tamaraTotal)} <small className="text-xs text-[var(--ink-muted)] font-sans">ر.س</small>
            </p>
          </div>
          <span className="label-mono text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/30 font-bold text-[11px]">
            {activeInstallments.filter(i => i.platform === 'Tamara').length} متاجر نشطة
          </span>
        </div>

        {/* Tabby Monthly Total */}
        <div className="glass-panel border-emerald-500/30 p-4 flex items-center justify-between">
          <div>
            <span className="label-mono text-[var(--accent)] font-bold">أقساط تابي (Tabby)</span>
            <p className="text-xl font-bold font-mono text-[var(--accent)] num-ltr mt-1">
              {formatCurrency(tabbyTotal)} <small className="text-xs text-[var(--ink-muted)] font-sans">ر.س</small>
            </p>
          </div>
          <span className="label-mono text-[var(--accent)] bg-[var(--accent-glow)] px-2.5 py-1 rounded-full border border-[var(--accent)]/30 font-bold text-[11px]">
            {activeInstallments.filter(i => i.platform === 'Tabby').length} متاجر نشطة
          </span>
        </div>

        {/* Total Cumulative Remaining Balance */}
        <div className="glass-panel border-amber-500/30 p-4 flex items-center justify-between">
          <div>
            <span className="label-mono text-amber-400 font-bold">إجمالي المتبقي التراكمي</span>
            <p className="text-xl font-bold font-mono text-amber-400 num-ltr mt-1">
              {formatCurrency(totalRemainingDebt)} <small className="text-xs text-[var(--ink-muted)] font-sans">ر.س</small>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-3.5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Platform & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Platform Pills */}
          <div className="flex items-center gap-1 bg-[rgba(0,0,0,0.3)] p-1 rounded-full border border-[var(--glass-border)]">
            <button
              onClick={() => setPlatformFilter('all')}
              className={`cursor-pointer px-3 py-1 text-xs font-semibold rounded-full transition ${
                platformFilter === 'all'
                  ? 'bg-[var(--glass-thick)] text-[var(--ink)] border border-[var(--glass-border)] shadow-xs'
                  : 'text-[var(--ink-muted)] hover:text-white'
              }`}
            >
              الكل (<span className="num-ltr">{installments.length}</span>)
            </button>
            <button
              onClick={() => setPlatformFilter('Tamara')}
              className={`cursor-pointer px-3 py-1 text-xs font-semibold rounded-full transition ${
                platformFilter === 'Tamara'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-xs'
                  : 'text-[var(--ink-muted)] hover:text-rose-400'
              }`}
            >
              تمارا (<span className="num-ltr">{installments.filter(i => i.platform === 'Tamara').length}</span>)
            </button>
            <button
              onClick={() => setPlatformFilter('Tabby')}
              className={`cursor-pointer px-3 py-1 text-xs font-semibold rounded-full transition ${
                platformFilter === 'Tabby'
                  ? 'bg-[var(--accent-glow)] text-[var(--accent)] border border-[var(--accent)]/30 shadow-xs'
                  : 'text-[var(--ink-muted)] hover:text-[var(--accent)]'
              }`}
            >
              تابي (<span className="num-ltr">{installments.filter(i => i.platform === 'Tabby').length}</span>)
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[rgba(0,0,0,0.3)] p-1 rounded-full border border-[var(--glass-border)]">
            <button
              onClick={() => setStatusFilter('active')}
              className={`cursor-pointer px-3 py-1 text-xs font-semibold rounded-full transition ${
                statusFilter === 'active'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
                  : 'text-[var(--ink-muted)] hover:text-white'
              }`}
            >
              النشطة فقط (<span className="num-ltr">{activeInstallments.length}</span>)
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`cursor-pointer px-3 py-1 text-xs font-semibold rounded-full transition ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-[var(--ink-muted)] hover:text-white'
              }`}
            >
              المكتملة 🎉 (<span className="num-ltr">{completedCount}</span>)
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`cursor-pointer px-2.5 py-1 text-xs font-semibold rounded-full transition ${
                statusFilter === 'all'
                  ? 'bg-white/10 text-white'
                  : 'text-[var(--ink-muted)] hover:text-white'
              }`}
            >
              كافة الحالات
            </button>
          </div>
        </div>

        {/* Search Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث في أسماء المتاجر والسلع (آيفون، Mokab، سفر...)"
          className="w-full md:w-72 text-xs bg-black/40 border border-[var(--glass-border)] rounded-full px-4 py-2 outline-none focus:border-[var(--accent)] text-[var(--ink)] placeholder:text-[var(--ink-muted)]/50"
        />
      </div>

      {/* Grid of Upgraded Interactive Installment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const isTamara = item.platform === 'Tamara';
          const isDone = item.status === 'completed' || item.remainingMonths <= 0;

          // Dynamic tracking math
          const totalMonths = item.totalMonths || Math.max(item.remainingMonths + (item.paidMonths || 0), 4);
          const paidMonths = isDone ? totalMonths : (item.paidMonths ?? Math.max(totalMonths - item.remainingMonths, 0));
          const remainingMonths = isDone ? 0 : Math.max(item.remainingMonths, 0);
          const remainingAmount = item.amount * remainingMonths;
          const completionPercentage = Math.min(Math.round((paidMonths / totalMonths) * 100), 100);

          const isEndingSoon = remainingMonths === 1 && !isDone;
          const isPaidThisMonth = Boolean(item.isPaidThisMonth);

          return (
            <div
              key={item.id}
              className={`glass-panel p-5 transition-all flex flex-col justify-between rounded-2xl relative overflow-hidden ${
                isDone 
                  ? 'border-emerald-500/30 opacity-75 bg-[rgba(16,185,129,0.03)]' 
                  : isPaidThisMonth
                    ? 'border-emerald-500/40 bg-[rgba(16,185,129,0.02)]'
                    : isEndingSoon 
                      ? 'border-amber-400/60 bg-[rgba(251,191,36,0.04)] shadow-sm' 
                      : isTamara
                        ? 'border-rose-500/25 hover:border-rose-500/40'
                        : 'border-emerald-500/25 hover:border-emerald-500/40'
              }`}
            >
              {/* Card Header Row: Platform Badge + Title + Action Icons */}
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`label-mono text-[9px] px-2.5 py-0.5 rounded-full font-bold shadow-xs ${
                      isTamara 
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' 
                        : 'bg-[var(--accent-glow)] text-[var(--accent)] border border-[var(--accent)]/30'
                    }`}>
                      {item.platform}
                    </span>
                    {item.category && (
                      <span className="text-[10px] text-[var(--ink-muted)] bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        {item.category}
                      </span>
                    )}
                  </div>

                  {/* Header Quick Controls */}
                  {!isReadOnlySimulation ? (
                    <div className="flex items-center gap-1">
                      {onEditInstallment && (
                        <button
                          onClick={() => onEditInstallment(item)}
                          className="cursor-pointer p-1.5 text-[var(--ink-muted)] hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                          title="تعديل القسط"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onToggleStatus(item.id);
                          if (!isDone) triggerCelebration();
                        }}
                        className={`cursor-pointer p-1.5 rounded-lg transition ${
                          isDone 
                            ? 'text-[var(--accent)] bg-[var(--accent-glow)]' 
                            : 'text-[var(--ink-muted)] hover:text-[var(--accent)] hover:bg-[var(--glass)]'
                        }`}
                        title={isDone ? 'إعادة الخطة للنشطة' : 'تحديد كمكتمل بالكامل'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteInstallment(item.id)}
                        className="cursor-pointer p-1.5 text-[var(--ink-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title="حذف القسط"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                      قراءة فقط
                    </span>
                  )}
                </div>

                {/* Plan/Store Title */}
                <h3 className={`font-extrabold text-[var(--ink)] text-sm sm:text-base leading-snug mb-1 ${
                  isDone ? 'line-through text-white/50' : ''
                }`}>
                  {item.name}
                </h3>
                
                <p className="text-[11px] text-[var(--ink-muted)] flex items-center gap-1 font-mono">
                  <span>من {item.start}</span>
                  <span>←</span>
                  <span>إلى {item.end}</span>
                </p>
              </div>

              {/* Middle Section: Financial Figures */}
              <div className="my-3.5 pt-3 border-t border-[var(--glass-border)] grid grid-cols-2 gap-2 bg-[rgba(0,0,0,0.25)] p-3 rounded-xl border">
                <div>
                  <span className="label-mono block text-[10px] text-[var(--ink-muted)]">القسط الشهري</span>
                  <p className="text-base font-bold font-mono text-[var(--ink)] num-ltr mt-0.5">
                    {formatCurrency(item.amount)} <small className="text-[10px] text-[var(--ink-muted)]">ر.س</small>
                  </p>
                </div>
                <div className="text-left">
                  <span className="label-mono block text-[10px] text-amber-400">إجمالي المتبقي</span>
                  <p className="text-base font-bold font-mono text-amber-400 num-ltr mt-0.5">
                    {formatCurrency(remainingAmount)} <small className="text-[10px] text-[var(--ink-muted)]">ر.س</small>
                  </p>
                </div>
              </div>

              {/* Smart Progress & Status Tracking */}
              <div className="space-y-2">
                {/* Status indicator row */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[11px] text-[var(--ink-muted)]">
                    تم سداد <strong className="font-mono text-white num-ltr font-bold">{paidMonths}</strong> من أصل <strong className="font-mono text-white num-ltr">{totalMonths}</strong> أشهر
                  </span>
                  
                  <span className={`label-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isDone 
                      ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                      : 'text-[var(--accent)] font-mono'
                  }`}>
                    {completionPercentage}%
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${completionPercentage}%`,
                      background: isDone 
                        ? 'linear-gradient(90deg, #10b981, #34d399)' 
                        : isTamara 
                          ? 'linear-gradient(90deg, #f43f5e, #fbbf24)' 
                          : 'linear-gradient(90deg, #10b981, #60a5fa)'
                    }}
                  ></div>
                </div>

                {/* Mini Installment Step Indicator Segments */}
                <div className="flex items-center gap-1 pt-1 justify-between">
                  {Array.from({ length: totalMonths }).map((_, stepIdx) => {
                    const isStepPaid = stepIdx < paidMonths;
                    const isCurrentStep = stepIdx === paidMonths && !isDone;

                    return (
                      <div
                        key={stepIdx}
                        className={`flex-1 h-1.5 rounded-full transition-all ${
                          isStepPaid 
                            ? 'bg-emerald-400' 
                            : isCurrentStep 
                              ? isTamara ? 'bg-rose-400 animate-pulse' : 'bg-blue-400 animate-pulse'
                              : 'bg-white/10'
                        }`}
                        title={`شهر ${stepIdx + 1} (${isStepPaid ? 'تم السداد' : isCurrentStep ? 'قيد السداد' : 'متبقي'})`}
                      />
                    );
                  })}
                </div>

                {/* Current Month Status Tag */}
                <div className="pt-1 flex items-center justify-between">
                  {isDone ? (
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>مكتمل بالكامل ومتحرر 🎉</span>
                    </span>
                  ) : isPaidThisMonth ? (
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25">
                      <Check className="w-3 h-3" />
                      <span>تم سداد قسط هذا الشهر ✅</span>
                    </span>
                  ) : isEndingSoon ? (
                    <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      <span>القسط الأخير (ينتهي هذا الشهر!)</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-[var(--ink-muted)] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[var(--ink-muted)]" />
                      <span>متبقي {remainingMonths} أشهر</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Interactive Action Row */}
              <div className="pt-3.5 mt-3 border-t border-[var(--glass-border)]">
                {!isReadOnlySimulation ? (
                  !isDone ? (
                    payingInstallmentId !== item.id ? (
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onPayMonth) onPayMonth(item.id, 'CHECKING_ACCOUNT');
                          }}
                          className="btn btn-primary text-xs py-1.5 px-3 flex-1 flex items-center justify-center gap-1.5 shadow-sm font-bold"
                          title="سداد قسط هذا الشهر مع الخصم المباشر من الحساب الجاري"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>سداد من الجاري</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPayingInstallmentId(item.id)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--ink-muted)] hover:text-white transition"
                          title="خيارات تسوية أخرى (خارجي أو سداد مسبق)"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {paidMonths > 0 && onUndoPayMonth && (
                          <button
                            type="button"
                            onClick={() => onUndoPayMonth(item.id)}
                            className="cursor-pointer p-1.5 text-[var(--ink-muted)] hover:text-white rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition"
                            title="تراجع عن سداد القسط الأخير"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5 bg-slate-900/90 p-2.5 rounded-xl border border-white/10 text-xs animate-fadeIn">
                        <p className="text-[10px] font-bold text-[var(--ink)] mb-1">اختر طريقة تسوية القسط:</p>
                        
                        <button
                          type="button"
                          onClick={() => {
                            if (onPayMonth) onPayMonth(item.id, 'CHECKING_ACCOUNT');
                            setPayingInstallmentId(null);
                          }}
                          className="w-full text-right p-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] flex items-center justify-between transition"
                        >
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="w-3 h-3" />
                            <span>الحساب الجاري</span>
                          </span>
                          <span className="text-[9px] text-emerald-400">يخصم من الرصيد</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onPayMonth) onPayMonth(item.id, 'EXTERNAL');
                            setPayingInstallmentId(null);
                          }}
                          className="w-full text-right p-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[11px] flex items-center justify-between transition"
                        >
                          <span className="flex items-center gap-1.5">
                            <ExternalLink className="w-3 h-3" />
                            <span>سداد خارجي</span>
                          </span>
                          <span className="text-[9px] text-blue-400">بدون خصم الجاري</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onPayMonth) onPayMonth(item.id, 'PREPAID');
                            setPayingInstallmentId(null);
                          }}
                          className="w-full text-right p-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[11px] flex items-center justify-between transition"
                        >
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3" />
                            <span>سداد مسبق</span>
                          </span>
                          <span className="text-[9px] text-purple-400">مدفوع مقدماً</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPayingInstallmentId(null)}
                          className="w-full text-center text-[10px] text-[var(--ink-muted)] hover:text-white pt-1"
                        >
                          إلغاء
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="w-full flex items-center justify-between">
                      <span className="text-xs text-emerald-400 font-bold">صفر التزامات 🎉</span>
                      {onUndoPayMonth && (
                        <button
                          onClick={() => onUndoPayMonth(item.id)}
                          className="text-xs text-[var(--ink-muted)] hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/5 transition"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>إعادة فتح الخطة</span>
                        </button>
                      )}
                    </div>
                  )
                ) : (
                  <div className="w-full text-center py-1 bg-white/5 rounded-xl border border-white/5 text-[11px] text-amber-300 font-bold">
                    معاينة المحاكاة التقديرية · إجراءات السداد معطلة
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass-panel p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[var(--ink-muted)]">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-[var(--ink)]">لا توجد أقساط تطابق خيارات الفلترة الحالية</h3>
          <p className="text-xs text-[var(--ink-muted)]">
            جرب تغيير المنصة أو فلتر الحالة أو إضافة قسط جديد
          </p>
        </div>
      )}

        </div>
      )}

    </div>
  );
};

