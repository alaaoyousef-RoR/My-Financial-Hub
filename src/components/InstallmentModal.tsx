import React, { useState, useEffect } from 'react';
import { InstallmentRecord, PlatformType } from '../types/finance';
import { X, Calculator, Edit3, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { generateInstallmentSchedule } from '../utils/financeCalculators';

interface InstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (installment: Omit<InstallmentRecord, 'id'>) => void;
  onUpdate?: (installment: InstallmentRecord) => void;
  editingInstallment?: InstallmentRecord | null;
  mode?: 'create' | 'edit';
}

export function calculateEndMonth(startMonthStr: string, totalMonths: number): string {
  if (!startMonthStr) return '';
  const parts = startMonthStr.split('-');
  if (parts.length < 2) return startMonthStr;
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month)) return startMonthStr;

  month += (totalMonths - 1);
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export const InstallmentModal: React.FC<InstallmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editingInstallment,
  mode = 'create'
}) => {
  const isEdit = mode === 'edit' || !!editingInstallment;

  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('Tamara');
  const [amount, setAmount] = useState<string>('');
  const [startMonth, setStartMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [totalMonths, setTotalMonths] = useState<number>(4);
  const [paidMonths, setPaidMonths] = useState<number>(0);
  const [category, setCategory] = useState<string>('مستلزمات وشخصي');

  useEffect(() => {
    if (editingInstallment && isOpen) {
      setName(editingInstallment.name || '');
      setPlatform(editingInstallment.platform || 'Tamara');
      setAmount(editingInstallment.amount ? String(editingInstallment.amount) : '');
      setStartMonth(editingInstallment.start || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
      setTotalMonths(editingInstallment.totalMonths || 4);
      setPaidMonths(editingInstallment.paidMonths || 0);
      setCategory(editingInstallment.category || 'مستلزمات وشخصي');
    } else if (!isOpen) {
      setName('');
      setPlatform('Tamara');
      setAmount('');
      const now = new Date();
      setStartMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
      setTotalMonths(4);
      setPaidMonths(0);
      setCategory('مستلزمات وشخصي');
    }
  }, [editingInstallment, isOpen]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const validTotalMonths = Math.max(totalMonths || 1, 1);
  const validPaidMonths = Math.min(Math.max(paidMonths || 0, 0), validTotalMonths);
  const remainingMonths = Math.max(validTotalMonths - validPaidMonths, 0);
  const remainingAmount = numAmount * remainingMonths;
  const endMonth = calculateEndMonth(startMonth, validTotalMonths);
  const status = remainingMonths === 0 ? 'completed' : 'active';
  const remainingNote = remainingMonths === 0 ? 'مكتمل بالكامل 🎉' : `${remainingMonths} أشهر متبقية`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || numAmount <= 0) return;

    if (isEdit && editingInstallment && onUpdate) {
      const updated: InstallmentRecord = {
        ...editingInstallment,
        name: name.trim(),
        platform,
        amount: numAmount,
        start: startMonth,
        end: endMonth,
        totalMonths: validTotalMonths,
        paidMonths: validPaidMonths,
        remainingMonths,
        remainingNote,
        status,
        category
      };
      updated.schedule = editingInstallment.schedule && editingInstallment.schedule.length === validTotalMonths
        ? editingInstallment.schedule
        : generateInstallmentSchedule(updated);
      onUpdate(updated);
    } else {
      const newItem: Omit<InstallmentRecord, 'id'> = {
        name: name.trim(),
        platform,
        amount: numAmount,
        start: startMonth,
        end: endMonth,
        totalMonths: validTotalMonths,
        paidMonths: validPaidMonths,
        remainingMonths,
        remainingNote,
        status,
        category
      };
      newItem.schedule = generateInstallmentSchedule(newItem as InstallmentRecord);
      onSave(newItem);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none font-['Readex_Pro',sans-serif]">
      <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-slate-700/80 bg-[#0f172a] shadow-2xl relative space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${
              isEdit 
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' 
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            }`}>
              {isEdit ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {isEdit ? 'تعديل بيانات القسط' : 'إضافة قسط جديد (تمارا / تابي)'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEdit ? 'تحديث عدد الأشهر، المبالغ المسددة، أو تاريخ البدء' : 'تسجيل خطة تقسيط جديدة وتتبع الأقساط التلقائي'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Row 1: Name & Platform */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">اسم المشتريات / القسط</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: آيفون تمارا، مشتريات نون"
                required
                className="w-full bg-[#090e1a] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">المنصة</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformType)}
                className="w-full bg-[#090e1a] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="Tamara">تمارا (Tamara)</option>
                <option value="Tabby">تابي (Tabby)</option>
                <option value="Bank">تمويل بنكي (Bank)</option>
                <option value="Other">منصة أخرى (Other)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Monthly Amount & Start Month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">المبلغ الشهري (ر.س)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="مثال: 250.00"
                required
                className="w-full bg-[#090e1a] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white num-ltr focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">تاريخ البدء (الشهر / السنة)</label>
              <input
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                required
                className="w-full bg-[#090e1a] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white num-ltr focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Row 3: Total Months & Paid Months */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">إجمالي الأقساط (عدد الأشهر)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={totalMonths}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  setTotalMonths(val);
                  if (paidMonths > val) setPaidMonths(val);
                }}
                required
                className="w-full bg-[#090e1a] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white num-ltr focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">الأقساط المسددة مسبقاً</label>
              <input
                type="number"
                min="0"
                max={validTotalMonths}
                value={paidMonths}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 0;
                  setPaidMonths(Math.min(Math.max(val, 0), validTotalMonths));
                }}
                required
                className="w-full bg-[#090e1a] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white num-ltr focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Category */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">تصنيف المشتريات (اختياري)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="مثال: أجهزة وإلكترونيات، ملابس، عناية"
              className="w-full bg-[#090e1a] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Live Calculated Summary Box */}
          <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-2 text-xs">
            <div className="flex items-center justify-between text-blue-300 font-bold border-b border-blue-500/20 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-400" />
                <span>الملخص والحساب التلقائي</span>
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                status === 'completed' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              }`}>
                {status === 'completed' ? 'مكتمل بالكامل 🎉' : 'خطة نشطة'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="bg-[#090e1a]/80 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">تاريخ الانتهاء</span>
                <span className="font-mono font-bold text-amber-300 num-ltr">{endMonth || '-'}</span>
              </div>

              <div className="bg-[#090e1a]/80 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">الأقساط المتبقية</span>
                <span className="font-mono font-bold text-white num-ltr">{remainingMonths} شهر</span>
              </div>

              <div className="bg-[#090e1a]/80 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">إجمالي المتبقي</span>
                <span className="font-mono font-bold text-emerald-400 num-ltr">{formatCurrency(remainingAmount)} ر.س</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost text-xs px-4 py-2 text-slate-400 hover:text-white"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={`btn font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition active:scale-95 ${
                isEdit 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30'
              }`}
            >
              {isEdit ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isEdit ? 'حفظ التعديلات' : 'إضافة القسط'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
