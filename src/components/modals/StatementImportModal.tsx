import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Trash2, 
  CheckSquare, 
  Square, 
  Filter, 
  Search, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { 
  parseBankStatement, 
  ParsedBankTransaction, 
  StatementSummary, 
  computeStatementSummary 
} from '../../utils/statementParser';
import { ExpenseRecord, ExpenseCategory, PaymentMethod, FinancialTransaction, AccountBalancesState } from '../../types/finance';
import { formatCurrency, triggerCelebration } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useFinancialState, sanitizeForFirestore } from '../../context/FinancialContext';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface StatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (count: number) => void;
}

const ALL_CATEGORIES: ExpenseCategory[] = [
  'طعام ومقاهي',
  'تسوق وشخصي',
  'بنزين وسيارة',
  'فواتير وخدمات',
  'سكن ومستلزمات',
  'صحة وعناية',
  'ترفيه وخروجات',
  'تغذية مخصص',
  'أخرى'
];

export const StatementImportModal: React.FC<StatementImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const { user } = useAuth();
  const { 
    expenses, 
    setExpenses, 
    transactions, 
    setTransactions, 
    accountBalances, 
    setAccountBalances,
    showToast 
  } = useFinancialState();

  // Wizard Step: 'upload' | 'preview' | 'importing'
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  
  // File & Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parsed Data State
  const [parsedTransactions, setParsedTransactions] = useState<ParsedBankTransaction[]>([]);
  const [summary, setSummary] = useState<StatementSummary | null>(null);

  // Review & Filter Controls
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');
  const [applyToCheckingBalance, setApplyToCheckingBalance] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  // Process and parse file
  const processSelectedFile = async (file: File) => {
    setErrorMessage(null);
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setErrorMessage('صيغة الملف غير مدعومة. يرجى رفع ملف بصيغة Excel (.xlsx, .xls) أو .csv');
      return;
    }

    setFileName(file.name);
    setIsLoading(true);

    try {
      const result = await parseBankStatement(file);

      if (!result.success) {
        setErrorMessage(result.error || 'فشل في قراءة محتويات الملف.');
        setIsLoading(false);
        return;
      }

      setParsedTransactions(result.transactions);
      setSummary(result.summary);
      setStep('preview');
    } catch (err: any) {
      console.error('Error in statement ingestion:', err);
      setErrorMessage('حدث خطأ غير متوقع أثناء معالجة الكشف: ' + (err.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setParsedTransactions(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item);
      setSummary(computeStatementSummary(updated));
      return updated;
    });
  };

  const handleSelectAll = (select: boolean) => {
    setParsedTransactions(prev => {
      const updated = prev.map(item => ({ ...item, selected: select }));
      setSummary(computeStatementSummary(updated));
      return updated;
    });
  };

  const handleCategoryChange = (id: string, newCategory: ExpenseCategory) => {
    setParsedTransactions(prev => 
      prev.map(item => item.id === id ? { ...item, selectedCategory: newCategory } : item)
    );
  };

  const handleDeleteItem = (id: string) => {
    setParsedTransactions(prev => {
      const updated = prev.filter(item => item.id !== id);
      setSummary(computeStatementSummary(updated));
      return updated;
    });
  };

  // Filtered view for preview table
  const visibleTransactions = useMemo(() => {
    return parsedTransactions.filter(item => {
      // Type Filter
      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;

      // Text Search
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesCat = item.selectedCategory.toLowerCase().includes(query);
        const matchesAmt = item.amount.toString().includes(query);
        const matchesDate = item.date.includes(query);
        return matchesDesc || matchesCat || matchesAmt || matchesDate;
      }

      return true;
    });
  }, [parsedTransactions, typeFilter, searchFilter]);

  // Execute Firestore writeBatch and commit to state
  const handleConfirmImport = async () => {
    const selectedItems = parsedTransactions.filter(item => item.selected);
    if (selectedItems.length === 0) {
      showToast('⚠️ يرجى تحديد عملية واحدة على الأقل للاستيراد.');
      return;
    }

    setStep('importing');

    try {
      // Convert parsed items into unified ExpenseRecords
      const newExpenses: ExpenseRecord[] = selectedItems.map(item => ({
        id: `stmt-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        desc: item.description,
        amount: item.amount,
        category: item.selectedCategory,
        method: 'مدى / بطاقة بنكية' as PaymentMethod,
        date: item.date,
        type: item.type === 'CREDIT' ? 'TOP_UP' : 'EXPENSE'
      }));

      // Convert into FinancialTransaction audit items
      const newTransactions: FinancialTransaction[] = selectedItems.map(item => ({
        id: `tx-stmt-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        type: item.type === 'CREDIT' ? 'income' : 'expense',
        title: item.description,
        amount: item.amount,
        date: item.date,
        sourceAccount: item.type === 'CREDIT' ? 'external' : 'checking',
        destinationAccount: item.type === 'CREDIT' ? 'checking' : undefined,
        notes: `مستورد من كشف الحساب: ${fileName} (${item.type === 'CREDIT' ? 'إيداع' : 'سحب'})`
      }));

      // Calculate net balance change if user opts to adjust checking balance
      let updatedCheckingBalance = accountBalances.checkingBalance;
      if (applyToCheckingBalance && summary) {
        // netCashFlow = credits - debits
        updatedCheckingBalance = Math.max(
          Math.round((accountBalances.checkingBalance + summary.netCashFlow) * 100) / 100, 
          0
        );
      }

      const mergedExpenses = [...newExpenses, ...expenses];
      const mergedTransactions = [...newTransactions, ...(transactions || [])];

      // Atomic Cloud Ingestion via Firestore writeBatch if authenticated
      if (user) {
        const batch = writeBatch(db);
        const dashboardDocRef = doc(db, 'users', user.uid, 'data', 'financial_dashboard');

        const updatePayload = sanitizeForFirestore({
          expenses: mergedExpenses,
          transactions: mergedTransactions,
          accountBalances: {
            ...accountBalances,
            checkingBalance: updatedCheckingBalance,
            lastUpdated: new Date().toISOString()
          },
          updatedAt: new Date().toISOString()
        });

        batch.set(dashboardDocRef, updatePayload, { merge: true });
        await batch.commit();
      }

      // Update in-memory state for instant reactivity
      setExpenses(mergedExpenses);
      setTransactions(mergedTransactions);
      if (applyToCheckingBalance) {
        setAccountBalances((prev: AccountBalancesState) => ({
          ...prev,
          checkingBalance: updatedCheckingBalance,
          lastUpdated: new Date().toISOString()
        }));
      }

      triggerCelebration();
      showToast(`تم استيراد ${selectedItems.length} عملية بنكية بنجاح وحفظها سحابياً! 🎉`);

      if (onImportSuccess) {
        onImportSuccess(selectedItems.length);
      }

      handleResetModal();
      onClose();
    } catch (err: any) {
      console.error('Error writing batch transactions to Firestore:', err);
      setErrorMessage(`فشل حفظ العمليات في السحابة: ${err.message || 'خطأ غير متوقع'}`);
      setStep('preview');
    }
  };

  const handleResetModal = () => {
    setStep('upload');
    setFileName('');
    setParsedTransactions([]);
    setSummary(null);
    setErrorMessage(null);
    setSearchFilter('');
    setTypeFilter('ALL');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn font-['Readex_Pro',sans-serif]">
      <div 
        className="w-full max-w-4xl bg-[#090e1a] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800/80 bg-[#070c16]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                استيراد كشف حساب بنكي (Bank Statement Import)
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  الإنماء / الراجحي / الأهلي
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                استخرج العمليات التاريخية من ملف Excel أو CSV مع التصنيف الآلي
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleResetModal();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scroll">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="flex-1 font-medium">{errorMessage}</span>
              <button 
                onClick={() => setErrorMessage(null)} 
                className="text-rose-400 hover:text-rose-200 text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* STEP 1: UPLOAD & DROPZONE */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center group ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10 scale-[0.99]'
                    : 'border-slate-800 hover:border-slate-700 bg-[#070c18] hover:bg-[#0a1122]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8" />
                  )}
                </div>

                <h3 className="font-bold text-base text-white mb-1">
                  {isLoading ? 'جاري قراءة وتحليل ملف كشف الحساب...' : 'اسحب وأفلت ملف كشف الحساب هنا، أو انقر للاختيار'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
                  يدعم صيغ <span className="text-emerald-400 font-mono font-bold">.xlsx</span> و <span className="text-emerald-400 font-mono font-bold">.xls</span> و <span className="text-emerald-400 font-mono font-bold">.csv</span> الصادرة من البنوك السعودية مثل مصرف الإنماء، الراجحي، والبنك الأهلي.
                </p>

                <button
                  type="button"
                  disabled={isLoading}
                  className="btn btn-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 pointer-events-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الفحص واستخراج الأعمدة...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>اختيار ملف من جهازك</span>
                    </>
                  )}
                </button>
              </div>

              {/* Supported Bank Features & Auto-Rules Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#070c18] border border-slate-800/80">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>كشف الأعمدة الذكي</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    التعرف التلقائي على أعمدة التاريخ، الوصف، السحب، والإيداع حتى مع تباين تسميات البنوك.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#070c18] border border-slate-800/80">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>تصنيف آلي بالذكاء الاصطناعي</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    تصنيف نفقاتك تلقائياً (مطاعم، بنزين، تسوق، فواتير) مع إمكانية التعديل السريع قبل التأكيد.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#070c18] border border-slate-800/80">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
                    <RefreshCw className="w-4 h-4" />
                    <span>مزامنة سحابية ذرية (Atomic)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    حفظ دفعة العمليات دفعة واحدة عبر Firebase writeBatch وتحديث الميزانية فوراً.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & CATEGORIZATION */}
          {(step === 'preview' || step === 'importing') && summary && (
            <div className="space-y-4">
              
              {/* Summary Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-[#070c18] border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">العمليات المحددة</span>
                  <div className="flex items-baseline gap-1.5">
                    <strong className="text-base text-white num-ltr">{summary.selectedCount}</strong>
                    <span className="text-[10px] text-slate-500">من أصل {summary.totalCount}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#070c18] border border-slate-800">
                  <span className="text-[11px] text-rose-400 block mb-0.5">إجمالي السحوبات (مصروف)</span>
                  <div className="flex items-baseline gap-1">
                    <strong className="text-base text-rose-400 num-ltr">{formatCurrency(summary.totalDebits)}</strong>
                    <span className="text-[10px] text-slate-500">ر.س</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#070c18] border border-slate-800">
                  <span className="text-[11px] text-emerald-400 block mb-0.5">إجمالي الإيداعات (تغذية)</span>
                  <div className="flex items-baseline gap-1">
                    <strong className="text-base text-emerald-400 num-ltr">{formatCurrency(summary.totalCredits)}</strong>
                    <span className="text-[10px] text-slate-500">ر.س</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#070c18] border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">الفترة الزمنية للكشف</span>
                  <div className="text-[11px] text-slate-300 font-mono truncate" title={`${summary.startDate || '-'} إلى ${summary.endDate || '-'}`}>
                    {summary.startDate ? `${summary.startDate} ↔ ${summary.endDate}` : 'غير محدد'}
                  </div>
                </div>
              </div>

              {/* Action Toolbar: Filter, Search, Select All */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between bg-[#070c18] p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute top-1/2 -translate-y-1/2 right-3" />
                    <input
                      type="text"
                      placeholder="بحث في الوصف، التاريخ أو المبلغ..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full bg-[#0a1020] border border-slate-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                    />
                  </div>

                  {/* Type Filter Pills */}
                  <div className="flex items-center gap-1 bg-[#0a1020] border border-slate-800 p-0.5 rounded-xl text-[11px]">
                    <button
                      type="button"
                      onClick={() => setTypeFilter('ALL')}
                      className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                        typeFilter === 'ALL' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      الكل ({parsedTransactions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypeFilter('DEBIT')}
                      className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                        typeFilter === 'DEBIT' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-rose-300'
                      }`}
                    >
                      سحب
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypeFilter('CREDIT')}
                      className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                        typeFilter === 'CREDIT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-emerald-300'
                      }`}
                    >
                      إيداع
                    </button>
                  </div>
                </div>

                {/* Bulk Select Toggles */}
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-[11px] font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تحديد الكل</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="text-[11px] font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Square className="w-3.5 h-3.5 text-slate-500" />
                    <span>إلغاء التحديد</span>
                  </button>
                </div>
              </div>

              {/* Parsed Transactions Preview Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-[#070c18]">
                <div className="max-h-[360px] overflow-y-auto custom-scroll">
                  <table className="w-full text-right text-xs">
                    <thead className="sticky top-0 bg-[#090e1c] border-b border-slate-800 text-slate-400 font-bold z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">اختيار</th>
                        <th className="py-2.5 px-3">التاريخ</th>
                        <th className="py-2.5 px-3">الوصف والتفاصيل</th>
                        <th className="py-2.5 px-3 text-left">المبلغ</th>
                        <th className="py-2.5 px-3">التصنيف المقترح</th>
                        <th className="py-2.5 px-2 text-center w-10">استبعاد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {visibleTransactions.map((item) => (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-white/[0.02] transition ${!item.selected ? 'opacity-40 bg-black/20' : ''}`}
                        >
                          {/* Selection Checkbox */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => handleToggleSelect(item.id)}
                              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 border-slate-700 bg-slate-900 cursor-pointer"
                            />
                          </td>

                          {/* Date */}
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                            {item.date}
                          </td>

                          {/* Description & Type Badge */}
                          <td className="py-2.5 px-3">
                            <div className="space-y-0.5">
                              <span className="font-bold text-white block max-w-xs truncate" title={item.description}>
                                {item.description}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className={`px-1.5 py-0.2 rounded font-bold ${
                                  item.type === 'CREDIT' 
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}>
                                  {item.type === 'CREDIT' ? 'إيداع' : 'سحب'}
                                </span>
                                {item.reference && (
                                  <span className="text-slate-500 font-mono">مرجع: {item.reference}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="py-2.5 px-3 text-left whitespace-nowrap">
                            <span className={`font-mono font-extrabold num-ltr ${
                              item.type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {item.type === 'CREDIT' ? `+${formatCurrency(item.amount)}` : `-${formatCurrency(item.amount)}`}
                            </span>
                            <small className="text-[10px] text-slate-500 mr-1">ر.س</small>
                          </td>

                          {/* Editable Category Dropdown */}
                          <td className="py-2.5 px-3">
                            <select
                              value={item.selectedCategory}
                              onChange={(e) => handleCategoryChange(item.id, e.target.value as ExpenseCategory)}
                              className="bg-[#0a1020] border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1 outline-none cursor-pointer focus:border-emerald-500/50"
                            >
                              {ALL_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Delete Item */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition cursor-pointer"
                              title="استبعاد العملية من الكشف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Additional Options */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#070c18] border border-slate-800/80">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={applyToCheckingBalance}
                    onChange={(e) => setApplyToCheckingBalance(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 border-slate-700 bg-slate-900 cursor-pointer"
                  />
                  <span>
                    تحديث رصيد الحساب الجاري تلقائياً بمقدار صافي التدفق ({summary.netCashFlow >= 0 ? `+${formatCurrency(summary.netCashFlow)}` : formatCurrency(summary.netCashFlow)} ر.س)
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleResetModal}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>رفع كشف آخر</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-slate-800/80 bg-[#070c16]">
          <button
            type="button"
            onClick={() => {
              handleResetModal();
              onClose();
            }}
            disabled={step === 'importing'}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
          >
            إلغاء
          </button>

          {step === 'preview' && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 hidden sm:inline">
                جاهز لاعتماد <strong className="text-white num-ltr">{summary?.selectedCount || 0}</strong> عملية
              </span>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={!summary || summary.selectedCount === 0}
                className="btn btn-primary px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>تأكيد واستيراد العمليات (Batch Ingestion)</span>
              </button>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري كتابة العمليات في Firestore وتحديث الميزانية...</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
