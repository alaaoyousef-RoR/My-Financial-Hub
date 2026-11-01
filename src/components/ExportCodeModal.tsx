import React, { useState } from 'react';
import { generateStandaloneHtml } from '../utils/generateStandaloneHtml';
import { 
  IncomeItem, 
  CarPlan, 
  FixedObligation, 
  InstallmentRecord, 
  ExpenseRecord, 
  SavingsItem, 
  LiabilityItem, 
  ReceivableRecord, 
  MonthlyRecord 
} from '../types/finance';
import { X, Copy, Check, Download, FileCode, Globe, HardDrive } from 'lucide-react';

interface ExportCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    incomes: IncomeItem[];
    carPlan: CarPlan;
    fixedObligations: FixedObligation[];
    installments: InstallmentRecord[];
    expenses: ExpenseRecord[];
    savings: SavingsItem[];
    liabilities: LiabilityItem[];
    receivables: ReceivableRecord[];
    monthlyData: MonthlyRecord[];
  };
}

export const ExportCodeModal: React.FC<ExportCodeModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullHtmlCode = generateStandaloneHtml(data);
  const codeSizeBytes = new Blob([fullHtmlCode]).size;
  const codeSizeKB = (codeSizeBytes / 1024).toFixed(1);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullHtmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullHtmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `index.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-4xl max-h-[92vh] flex flex-col border border-[var(--glass-border)] shadow-2xl overflow-hidden bg-[#09090b]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--glass-border)] flex justify-between items-center bg-[var(--glass)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                استخراج كود HTML/JS/CSS النهائي كاملاً
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                ملف مستقل أحادي (Single-File) يحتوي كامل المنظومة، خط Readex Pro، والحفظ التلقائي في LocalStorage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-white hover:bg-[var(--glass-hover)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info & Action Bar */}
        <div className="p-4 sm:p-5 bg-[rgba(255,255,255,0.02)] border-b border-[var(--glass-border)] flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-[var(--ink-muted)]">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span>الحجم: <strong className="text-white num-ltr">{codeSizeKB} KB</strong></span>
            </span>
            <span className="flex items-center gap-1.5 text-[var(--ink-muted)]">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>جاهز للنشر الفوري (Zero-Config)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`btn text-xs py-2 px-4 flex items-center gap-1.5 transition ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-[var(--glass-thick)] hover:bg-[var(--glass-hover)] text-white border border-[var(--glass-border)]'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم نسخ الكود بنجاح!' : 'نسخ الكود بالكامل'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>تحميل ملف index.html</span>
            </button>
          </div>
        </div>

        {/* Code Preview Box */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scroll font-mono text-xs">
          <div className="relative bg-[#050507] p-4 rounded-xl border border-[var(--glass-border)] text-[rgba(255,255,255,0.85)] leading-relaxed select-all overflow-x-auto">
            <pre className="whitespace-pre num-ltr text-[11px]">{fullHtmlCode.slice(0, 3500)}
            {fullHtmlCode.length > 3500 && `\n\n... [بقية الكود يحتوي على كافة التبويبات والدوال الحسابية والألوان (${(fullHtmlCode.length - 3500)} حرف إضافي) - انقر على 'نسخ الكود بالكامل' أو 'تحميل ملف index.html' للحصول عليه دون أي نقصان] ...`}
            </pre>
          </div>
        </div>

        {/* Deployment Instructions Footer */}
        <div className="p-3.5 sm:px-5 border-t border-[var(--glass-border)] bg-[var(--glass)] text-[11px] text-[var(--ink-muted)] flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>💡 <strong>طريقة النشر المباشر:</strong> قم برفع الملف باسم <code className="text-amber-300">index.html</code> على GitHub Pages أو Netlify أو cPanel أو افتحه مباشرة في أي متصفح.</span>
          <button
            onClick={onClose}
            className="btn btn-ghost text-xs py-1 px-3 self-end sm:self-auto"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
