import React from 'react';
import { AlertTriangle, Trash2, X, RefreshCw } from 'lucide-react';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none font-['Readex_Pro',sans-serif]">
      <div 
        className="glass-panel w-full max-w-md p-6 rounded-3xl border border-rose-500/40 bg-[#0f172a] shadow-2xl relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Title & Body */}
        <div className="space-y-2 mb-6">
          <h3 className="text-lg font-black text-white">
            تصفير شامل للبيانات وبدء سستم جديد (Clean Template)
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            هل أنت متأكد من تصفير كافة البيانات وبدء سستم جديد؟ سيتم تصفير الأرصدة البنكية، وحذف سجلات المصاريف، والأقساط، والالتزامات للبدء كقالب نظيف وجديد بالكامل (0.00 ر.س).
          </p>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mt-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 shrink-0 text-rose-400" />
            <span>سيتم تفريغ التخزين المحلي فوراً وتحديث واجهة النظام دون الحاجة لإعادة تحميل المتصفح.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost text-xs px-4 py-2 text-slate-400 hover:text-white"
          >
            إلغاء وتراجع
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="btn bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg border border-rose-400/30 flex items-center gap-2 cursor-pointer transition active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>تصفير وبدء سستم جديد</span>
          </button>
        </div>
      </div>
    </div>
  );
};
