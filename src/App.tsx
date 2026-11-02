import React, { useState } from 'react';
import { 
  AuthProvider, 
  useAuth 
} from './context/AuthContext';
import { 
  FinancialProvider, 
  useFinancialState 
} from './context/FinancialContext';
import { 
  MonthProvider, 
  useMonthContext 
} from './context/MonthContext';
import { 
  ExpenseCategory, 
  PaymentMethod 
} from './types/finance';
import { formatCurrency, triggerCelebration } from './utils/formatters';
import { ChevronDown, ChevronUp, BarChart3, Loader2 } from 'lucide-react';

import { AuthView } from './components/AuthView';
import { Navbar } from './components/Navbar';
import { MonthSelector } from './components/MonthSelector';
import { AccountBalances } from './components/AccountBalances';
import { KPICards } from './components/KPICards';
import { CashFlowPipeline } from './components/CashFlowPipeline';
import { ChartsSection } from './components/ChartsSection';
import { WorkstationSidebar } from './components/WorkstationSidebar';
import { IncomeAndFixedSection } from './components/IncomeAndFixedSection';
import { InstallmentsView } from './components/InstallmentsView';
import { ExpensesView } from './components/ExpensesView';
import { SavingsSection } from './components/SavingsSection';
import { LiabilitiesAndReceivablesView } from './components/LiabilitiesAndReceivablesView';
import { 
  AddExpenseModal, 
  AddInstallmentModal, 
  AddIncomeModal, 
  AddFixedObligationModal, 
  AddSavingsModal, 
  AddReceivableModal, 
  AddLiabilityModal 
} from './components/Modals';
import { ExportCodeModal } from './components/ExportCodeModal';
import { ResetConfirmationModal } from './components/ResetConfirmationModal';
import { InstallmentModal } from './components/InstallmentModal';
import { StatementImportModal } from './components/modals/StatementImportModal';
import { SetStartingBalanceModal } from './components/onboarding/SetStartingBalanceModal';
import { EmptyDashboardState } from './components/dashboard/EmptyDashboardState';
import { AllowancePlanner } from './components/dashboard/AllowancePlanner';
import { InstallmentRecord, SettlementMethod } from './types/finance';

function DashboardAppContent() {
  const { user, loading: authLoading } = useAuth();
  const financial = useFinancialState();
  const monthContext = useMonthContext();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Collapsible Chart container
  const [isChartExpanded, setIsChartExpanded] = useState<boolean>(true);

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<InstallmentRecord | null>(null);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false);
  const [isLiabilityModalOpen, setIsLiabilityModalOpen] = useState(false);
  const [isExportCodeModalOpen, setIsExportCodeModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isStatementImportModalOpen, setIsStatementImportModalOpen] = useState(false);
  const [isStartingBalanceModalOpen, setIsStartingBalanceModalOpen] = useState(false);

  if (authLoading || financial.dataLoading) {
    return (
      <div className="min-h-screen bg-[#070c18] text-white flex flex-col items-center justify-center space-y-4 font-['Readex_Pro',sans-serif]">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-emerald-500/30 animate-ping"></div>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-300 animate-pulse">
          جاري تحميل الجلسة والبيانات السحابية المخصصة...
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const {
    incomes,
    carPlan,
    fixedObligations,
    installments,
    expenses,
    savings,
    liabilities,
    receivables,
    monthlyData,
    accountBalances,
    toastMessage,

    totalPersonalExpenses,
    totalSavings,
    unpaidCommitments,

    setIncomes,
    setFixedObligations,

    payInstallment,
    undoPayInstallment,
    toggleInstallmentStatus,
    deleteInstallment,
    saveInstallment,
    updateInstallment,

    transferToSavings,
    deleteSavings,

    logExpense,
    deleteExpense,

    addIncome,
    deleteIncome,

    payCarInstallment,
    updateCarPlan,

    updateAccountBalances,
    collectReceivable,
    deleteReceivable,
    saveReceivable,

    saveLiability,
    deleteLiability,

    saveFixedObligation,
    deleteFixedObligation,

    exportBackupJSON,
    importBackupJSON,
    resetAllData,
    resetToZeroTestMode,
    showToast
  } = financial;

  // Handle Pay Installment with Month Context Guard & Settlement Method
  const handlePayInstallmentSafely = (id: string, method?: SettlementMethod) => {
    if (monthContext.isReadOnlySimulation) {
      showToast(`⚠️ أنت في وضع المحاكاة لشهر مستقبلي (${monthContext.selectedMonth.name}). لإجراء سداد بنكي فعلي، انتقل إلى الشهر الحالي المباشر.`);
      return;
    }
    payInstallment(id, method);
  };

  // Handle Pay Car Installment with Month Context Guard & Settlement Method
  const handlePayCarSafely = (method?: SettlementMethod) => {
    if (monthContext.isReadOnlySimulation) {
      showToast(`⚠️ أنت في وضع المحاكاة لشهر مستقبلي. سداد الأقساط متاح في الشهر الحالي المباشر فقط.`);
      return;
    }
    payCarInstallment(method);
  };

  // Current Month Record for Aside and KPIs (strictly defaults to 0)
  const currentMonthRecord = {
    id: monthContext.selectedMonth.id,
    month: monthContext.selectedMonth.name,
    salary: monthContext.activeMonthIncome,
    car: monthContext.activeMonthCar,
    home: fixedObligations.find(f => f.category === 'سكن وإيجار')?.amount || 0,
    gas: fixedObligations.find(f => f.category === 'بنزين وتشغيل')?.amount || 0,
    tamara: monthContext.activeMonthTamara,
    tabby: monthContext.activeMonthTabby
  };

  // Timeline cumulative totals for footer
  const totalForecastIncome = monthlyData.reduce((acc, m) => acc + m.salary, 0);
  const totalForecastNet = monthlyData.reduce((acc, m) => {
    const deduction = m.car + m.home + m.gas + m.tamara + m.tabby;
    return acc + (m.salary - deduction);
  }, 0);

  return (
    <div className="text-[var(--ink)] antialiased min-h-screen flex flex-col font-sans selection:bg-[var(--accent)] selection:text-black">
      
      {/* Top Header & Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
        onOpenInstallmentModal={() => setIsInstallmentModalOpen(true)}
        onOpenReceivableModal={() => setIsReceivableModalOpen(true)}
        onOpenIncomeModal={() => setIsIncomeModalOpen(true)}
        onOpenSavingsModal={() => setIsSavingsModalOpen(true)}
        onOpenStatementImportModal={() => setIsStatementImportModalOpen(true)}
        onExportJSON={exportBackupJSON}
        onExportHTML={() => {
          setIsExportCodeModalOpen(true);
          triggerCelebration();
        }}
        onImport={importBackupJSON}
        onReset={() => setIsResetModalOpen(true)}
        onResetToZero={() => setIsResetModalOpen(true)}
        onPrint={() => window.print()}
      />

      {/* Main Responsive Layout Container */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        
        {/* Dynamic Month Selector Bar (Active Month vs. Upcoming Simulation Months) */}
        <MonthSelector />

        {/* TAB 1: Main Overview / Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Zero-State Welcoming Banner for Clean Slate / First-Time Users */}
            {expenses.length === 0 && incomes.length === 0 && (
              <EmptyDashboardState
                onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
                onOpenIncomeModal={() => setIsIncomeModalOpen(true)}
                onOpenStatementImportModal={() => setIsStatementImportModalOpen(true)}
                onOpenStartingBalanceModal={() => setIsStartingBalanceModalOpen(true)}
              />
            )}

            {/* Liquid Accounts Tracker: Balanced 3-Column Grid */}
            <AccountBalances
              checkingBalance={monthContext.isReadOnlySimulation ? monthContext.activeMonthCheckingBalance : accountBalances.checkingBalance}
              savingsBalance={monthContext.isReadOnlySimulation ? monthContext.activeMonthSavingsBalance : accountBalances.savingsBalance}
              unpaidCommitments={unpaidCommitments}
              emergencyTarget={accountBalances.emergencyTarget || 0}
              onUpdateBalances={updateAccountBalances}
              onOpenSavingsModal={() => setIsSavingsModalOpen(true)}
              isReadOnlySimulation={monthContext.isReadOnlySimulation}
            />

            {/* Dashboard Workstation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_310px] gap-6 items-start w-full">
              
              {/* Primary Content Column */}
              <div className="space-y-6 min-w-0">
                
                {/* 4 Semantic Metric Cards */}
                <KPICards
                  currentMonthRecord={currentMonthRecord}
                  receivables={receivables}
                  allMonths={monthlyData}
                  carPlan={carPlan}
                  totalIncome={monthContext.activeMonthIncome}
                  totalFixed={monthContext.activeMonthFixed}
                  totalBNPL={monthContext.activeMonthBNPL}
                  discretionaryNet={monthContext.activeMonthDiscretionaryNet}
                  onPayCarInstallment={handlePayCarSafely}
                  isReadOnlySimulation={monthContext.isReadOnlySimulation}
                />

                {/* Strict Cashflow Equation Pipeline */}
                <CashFlowPipeline
                  totalIncome={monthContext.activeMonthIncome}
                  totalFixed={monthContext.activeMonthFixed}
                  totalBNPL={monthContext.activeMonthBNPL}
                  totalPersonalExpenses={totalPersonalExpenses}
                  totalSavings={totalSavings}
                />

                {/* Decoupled Multi-Week Allowance Planner */}
                <AllowancePlanner
                  isReadOnlySimulation={monthContext.isReadOnlySimulation}
                />

                {/* Collapsible Chart Section */}
                <div className="glass-panel p-4 sm:p-5 transition-all duration-300 rounded-2xl border border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setIsChartExpanded(prev => !prev)}
                    className="w-full flex justify-between items-center text-right cursor-pointer select-none group"
                    aria-expanded={isChartExpanded}
                    title={isChartExpanded ? 'طي المخطط لتوفير المساحة' : 'توسيع وعرض المخطط التفصيلي'}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center shrink-0">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm sm:text-base text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                            مسار انخفاض الأقساط ونمو الصافي المتاح (2026-2027)
                          </h3>
                        </div>
                        <p className="text-xs text-[var(--ink-muted)]">
                          {isChartExpanded
                            ? 'مخطط تفاعلي يوضح تراجع التزامات تمارا وتابي حتى التحرر الكامل في مارس 2027'
                            : 'انقر لتوسيع المخطط ومتابعة تفاصيل مسار التحرر المالي'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="label-mono text-[10px] text-[var(--accent)] bg-[var(--accent-glow)] px-2.5 py-0.5 rounded-full border border-[var(--accent)]/30 font-bold hidden sm:inline-block">
                        مسار التحرر
                      </span>
                      <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 text-[var(--ink-muted)] group-hover:text-white transition">
                        {isChartExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </button>

                  {isChartExpanded && (
                    <div className="mt-4 pt-3.5 border-t border-[var(--glass-border)] animate-fadeIn">
                      <ChartsSection monthlyData={monthlyData} />
                    </div>
                  )}
                </div>

              </div>

              {/* Aside Column: Circular Graph + Goal + Car Tracker */}
              <div className="w-full">
                <WorkstationSidebar
                  currentMonthRecord={currentMonthRecord}
                  carPlan={carPlan}
                  checkingBalance={accountBalances.checkingBalance}
                  onPayCarInstallment={handlePayCarSafely}
                  isReadOnlySimulation={monthContext.isReadOnlySimulation}
                />
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: Income & Fixed Obligations */}
        {activeTab === 'income_fixed' && (
          <section className="space-y-6">
            <IncomeAndFixedSection
              incomes={incomes}
              fixedObligations={fixedObligations}
              carPlan={carPlan}
              onUpdateIncomes={setIncomes}
              onUpdateFixed={setFixedObligations}
              onUpdateCarPlan={updateCarPlan}
              onOpenAddIncomeModal={() => setIsIncomeModalOpen(true)}
              onOpenAddFixedModal={() => setIsFixedModalOpen(true)}
              isReadOnlySimulation={monthContext.isReadOnlySimulation}
            />
          </section>
        )}

        {/* TAB 3: BNPL Installments (Tamara & Tabby) */}
        {activeTab === 'installments' && (
          <section className="space-y-6">
            <InstallmentsView
              installments={installments}
              onAddClick={() => {
                setEditingInstallment(null);
                setIsInstallmentModalOpen(true);
              }}
              onEditInstallment={(item) => {
                setEditingInstallment(item);
                setIsInstallmentModalOpen(true);
              }}
              onDeleteInstallment={deleteInstallment}
              onToggleStatus={toggleInstallmentStatus}
              onPayMonth={handlePayInstallmentSafely}
              onUndoPayMonth={undoPayInstallment}
              isReadOnlySimulation={monthContext.isReadOnlySimulation}
            />
          </section>
        )}

        {/* TAB 4: Personal Daily Expenses */}
        {activeTab === 'expenses' && (
          <section className="space-y-6">
            <ExpensesView
              expenses={expenses}
              discretionaryNet={monthContext.activeMonthDiscretionaryNet}
              onAddClick={() => setIsExpenseModalOpen(true)}
              onQuickAdd={(desc, amt, cat, meth, dt) => logExpense(desc, amt, cat, meth, dt)}
              onDeleteExpense={deleteExpense}
              isReadOnlySimulation={monthContext.isReadOnlySimulation}
              onOpenStatementImportModal={() => setIsStatementImportModalOpen(true)}
            />
          </section>
        )}

        {/* TAB 5: Savings & Assets */}
        {activeTab === 'savings' && (
          <section className="space-y-6">
            <SavingsSection
              savings={savings}
              carBalloonTarget={carPlan.balloonPayment}
              onAddSavings={(item) => transferToSavings(item.title, item.amount, item.category, item.notes)}
              onDeleteSavings={deleteSavings}
              onOpenAddModal={() => setIsSavingsModalOpen(true)}
              isReadOnlySimulation={monthContext.isReadOnlySimulation}
            />
          </section>
        )}

        {/* TAB 6: Liabilities & Receivables */}
        {activeTab === 'liabilities' && (
          <section className="space-y-6">
            <LiabilitiesAndReceivablesView
              liabilities={liabilities}
              receivables={receivables}
              onAddLiability={(item) => saveLiability(item.title, item.amount, item.dueDate, item.category, item.notes)}
              onDeleteLiability={deleteLiability}
              onAddReceivable={saveReceivable}
              onDeleteReceivable={deleteReceivable}
              onCollectReceivable={collectReceivable}
              onUncollectReceivable={(id) => {
                deleteReceivable(id);
                showToast('تم إلغاء تحصيل المستحق');
              }}
              onOpenAddLiabilityModal={() => setIsLiabilityModalOpen(true)}
              onOpenAddReceivableModal={() => setIsReceivableModalOpen(true)}
              isReadOnlySimulation={monthContext.isReadOnlySimulation}
            />
          </section>
        )}

      </main>

      {/* MODALS */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={(desc, amount, category, method, date) => {
          logExpense(desc, amount, category, method, date);
          setIsExpenseModalOpen(false);
        }}
      />

      <InstallmentModal
        isOpen={isInstallmentModalOpen}
        onClose={() => {
          setIsInstallmentModalOpen(false);
          setEditingInstallment(null);
        }}
        editingInstallment={editingInstallment}
        mode={editingInstallment ? 'edit' : 'create'}
        onSave={(newItem) => {
          saveInstallment(newItem.name, newItem.platform || 'Other', newItem.amount, newItem.start, newItem.end, newItem.remainingMonths, newItem.category);
          setIsInstallmentModalOpen(false);
          setEditingInstallment(null);
        }}
        onUpdate={(updatedItem) => {
          updateInstallment(updatedItem);
          setIsInstallmentModalOpen(false);
          setEditingInstallment(null);
        }}
      />

      <AddIncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSave={(title, amount, category, notes) => {
          addIncome(title, amount, 'monthly', category, true, notes);
          setIsIncomeModalOpen(false);
        }}
      />

      <AddFixedObligationModal
        isOpen={isFixedModalOpen}
        onClose={() => setIsFixedModalOpen(false)}
        onSave={(title, amount, category, notes) => {
          saveFixedObligation(title, amount, category, undefined, notes);
          setIsFixedModalOpen(false);
        }}
      />

      <AddSavingsModal
        isOpen={isSavingsModalOpen}
        onClose={() => setIsSavingsModalOpen(false)}
        onSave={(title, amount, category, notes) => {
          transferToSavings(title, amount, category, notes);
          setIsSavingsModalOpen(false);
        }}
      />

      <AddReceivableModal
        isOpen={isReceivableModalOpen}
        onClose={() => setIsReceivableModalOpen(false)}
        onSave={(name, amount, notes) => {
          saveReceivable(name, amount, notes);
          setIsReceivableModalOpen(false);
        }}
      />

      <AddLiabilityModal
        isOpen={isLiabilityModalOpen}
        onClose={() => setIsLiabilityModalOpen(false)}
        onSave={(title, amount, dueDate, category, notes) => {
          saveLiability(title, amount, dueDate, category, notes);
          setIsLiabilityModalOpen(false);
        }}
      />

      <ExportCodeModal
        isOpen={isExportCodeModalOpen}
        onClose={() => setIsExportCodeModalOpen(false)}
        data={{
          incomes,
          carPlan,
          fixedObligations,
          installments,
          expenses,
          savings,
          liabilities,
          receivables,
          monthlyData
        }}
      />

      {/* Clean Template Reset Confirmation Modal */}
      <ResetConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={resetAllData}
      />

      {/* Bank Statement Ingestion Modal (.xlsx / .csv) */}
      <StatementImportModal
        isOpen={isStatementImportModalOpen}
        onClose={() => setIsStatementImportModalOpen(false)}
      />

      {/* Starting Balance Onboarding Modal */}
      <SetStartingBalanceModal
        isOpen={isStartingBalanceModalOpen}
        onClose={() => setIsStartingBalanceModalOpen(false)}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-[var(--surface-light)] border border-[var(--accent)] text-[var(--ink)] text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="glass-panel mx-3 sm:mx-6 mb-3 sm:mb-4 py-3 px-4 sm:px-8 text-xs text-[var(--ink-muted)] flex flex-col sm:flex-row justify-between items-center gap-2 print:hidden select-none border border-slate-800/80">
        <div>مركز الإدارة المالية الشخصية الذكي © 2026 · نظام الهيكلة المحاسبية الصارمة</div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div><span className="label-mono">إجمالي الدخل:</span> <span className="num-ltr font-bold text-[var(--ink)]">{formatCurrency(totalForecastIncome)}</span></div>
          <div><span className="label-mono">تراكمي الصافي:</span> <span className="num-ltr font-bold text-[var(--accent)]" style={{ color: totalForecastNet >= 0 ? 'var(--accent)' : 'var(--danger)' }}>{totalForecastNet >= 0 ? '+' : ''}{formatCurrency(totalForecastNet)}</span></div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FinancialProvider>
        <MonthProvider>
          <DashboardAppContent />
        </MonthProvider>
      </FinancialProvider>
    </AuthProvider>
  );
}
