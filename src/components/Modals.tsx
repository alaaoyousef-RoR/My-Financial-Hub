import React, { useState } from 'react';
import { 
  ExpenseCategory, 
  PaymentMethod, 
  PlatformType,
  IncomeCategory,
  FixedObligationCategory,
  SavingsCategory,
  LiabilityCategory
} from '../types/finance';
import { X, Receipt, CreditCard, HandCoins, Banknote, Car, PiggyBank, ShieldAlert } from 'lucide-react';

/* 1. Add Expense Modal */
interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (desc: string, amount: number, category: ExpenseCategory, method: PaymentMethod, date: string) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onSave }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('طعام ومقاهي');
  const [method, setMethod] = useState<PaymentMethod>('مدى / بطاقة بنكية');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !amount) return;
    onSave(desc.trim(), parseFloat(amount), category, method, date);
    setDesc('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-glow)] border border-[var(--accent)] text-[var(--accent)] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-[var(--ink)] text-sm">تسجيل مصروف شخصي جديد</h3>
          </div>
          <button onClick={onClose} className="cursor-pointer text-[var(--ink-muted)] hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="label-mono block mb-1">وصف الصرف / السلعة</label>
            <input
              type="text"
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="مثال: قهوة، مطعم، بنزين، تموينات..."
              className="w-full bg-[#09090b] border border-[var(--glass-border)] rounded-xl p-2.5 outline-none focus:border-[var(--accent)] text-[var(--ink)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="label-mono block mb-1">المبلغ (ر.س)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#09090b] border border-[var(--glass-border)] rounded-xl p-2.5 outline-none focus:border-[var(--accent)] font-mono num-ltr text-[var(--ink)]"
              />
            </div>
            <div>
              <label className="label-mono block mb-1">التاريخ</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#09090b] border border-[var(--glass-border)] rounded-xl p-2.5 outline-none focus:border-[var(--accent)] font-mono num-ltr text-[var(--ink)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="label-mono block mb-1">التصنيف</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-[#09090b] border border-[var(--glass-border)] rounded-xl p-2.5 outline-none focus:border-[var(--accent)] text-[var(--ink)]"
              >
                <option value="طعام ومقاهي">طعام ومقاهي</option>
                <option value="تسوق وشخصي">تسوق وشخصي</option>
                <option value="بنزين وسيارة">بنزين وسيارة</option>
                <option value="فواتير وخدمات">فواتير وخدمات</option>
                <option value="سكن ومستلزمات">سكن ومستلزمات</option>
                <option value="صحة وعناية">صحة وعناية</option>
                <option value="ترفيه وخروجات">ترفيه وخروجات</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            <div>
              <label className="label-mono block mb-1">طريقة الدفع</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full bg-[#09090b] border border-[var(--glass-border)] rounded-xl p-2.5 outline-none focus:border-[var(--accent)] text-[var(--ink)]"
              >
                <option value="مدى / بطاقة بنكية">مدى / بطاقة بنكية</option>
                <option value="أبل باي (Apple Pay)">أبل باي (Apple Pay)</option>
                <option value="كاش">كاش</option>
                <option value="تمارا">تمارا</option>
                <option value="تابي">تابي</option>
                <option value="تحويل بنكي">تحويل بنكي</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-[var(--glass-border)]">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost text-xs py-1.5 px-3"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs py-1.5 px-4 font-bold"
            >
              حفظ المصروف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* 2. Add Installment Modal */
interface AddInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, platform: PlatformType, amount: number, start: string, end: string, remainingMonths: number, category?: string) => void;
}

export const AddInstallmentModal: React.FC<AddInstallmentModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('Tamara');
  const [amount, setAmount] = useState('');
  const [start, setStart] = useState('Oct-26');
  const [end, setEnd] = useState('Jan-27');
  const [remainingMonths, setRemainingMonths] = useState('3');
  const [category, setCategory] = useState('تسوق ومشتريات');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    onSave(name.trim(), platform, parseFloat(amount), start, end, parseInt(remainingMonths) || 1, category);
    setName('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--ink-faint)] rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-[var(--ink-faint)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[var(--surface-light)] border border-[var(--ink-faint)] text-[var(--indigo)] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[var(--ink)] text-sm">إضافة قسط جديد (تمارا / تابي)</h3>
          </div>
          <button onClick={onClose} className="cursor-pointer text-[var(--ink-muted)] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="label-mono block mb-1">اسم المتجر أو السلعة</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: جرير، نون، اكسترا..."
              className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-[var(--indigo)] text-[var(--ink)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="label-mono block mb-1">الجهة</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformType)}
                className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-[var(--indigo)] text-[var(--ink)]"
              >
                <option value="Tamara">تمارا (Tamara)</option>
                <option value="Tabby">تابي (Tabby)</option>
                <option value="Bank">تقسيط بنكي</option>
              </select>
            </div>
            <div>
              <label className="label-mono block mb-1">القسط الشهري (ر.س)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-[var(--indigo)] font-mono num-ltr text-[var(--ink)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label-mono block mb-1">البداية</label>
              <input
                type="text"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
                placeholder="Oct-26"
                className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-[var(--indigo)] text-[var(--ink)]"
              />
            </div>
            <div>
              <label className="label-mono block mb-1">النهاية</label>
              <input
                type="text"
                required
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                placeholder="Jan-27"
                className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-[var(--indigo)] text-[var(--ink)]"
              />
            </div>
            <div>
              <label className="label-mono block mb-1">الأشهر المتبقية</label>
              <input
                type="number"
                required
                value={remainingMonths}
                onChange={(e) => setRemainingMonths(e.target.value)}
                className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-[var(--indigo)] font-mono num-ltr text-[var(--ink)]"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-[var(--ink-faint)]">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-3 py-1.5 border border-[var(--ink-faint)] rounded text-[var(--ink-muted)] hover:text-white"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="cursor-pointer px-4 py-1.5 bg-[var(--indigo)] hover:brightness-110 text-white font-bold rounded"
            >
              إضافة القسط
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* 3. Add Income Modal */
interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, amount: number, category: IncomeCategory, notes?: string) => void;
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('راتب أساسي');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    onSave(title.trim(), parseFloat(amount), category, notes);
    setTitle('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--ink-faint)] rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-[var(--ink-faint)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[var(--surface-light)] border border-[var(--ink-faint)] text-[var(--accent)] flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[var(--ink)] text-sm">إضافة مصدر دخل جديد</h3>
          </div>
          <button onClick={onClose} className="cursor-pointer text-[var(--ink-muted)] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="label-mono block mb-1">اسم الدخل</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: عمل حر، استشارة..."
              className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-[var(--accent)] text-[var(--ink)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="label-mono block mb-1">المبلغ (ر.س)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-[var(--accent)] font-mono num-ltr text-[var(--ink)]"
              />
            </div>
            <div>
              <label className="label-mono block mb-1">التصنيف</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-[var(--accent)] text-[var(--ink)]"
              >
                <option value="راتب أساسي">راتب أساسي</option>
                <option value="عمل حر / استشارات">عمل حر / استشارات</option>
                <option value="أرباح واستثمارات">أرباح واستثمارات</option>
                <option value="مكافآت وحوافز">مكافآت وحوافز</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-[var(--ink-faint)]">
            <button type="button" onClick={onClose} className="cursor-pointer px-3 py-1.5 border border-[var(--ink-faint)] rounded text-[var(--ink-muted)] hover:text-white">إلغاء</button>
            <button type="submit" className="cursor-pointer px-4 py-1.5 bg-[var(--accent)] hover:brightness-110 text-black font-bold rounded">حفظ الدخل</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* 4. Add Fixed Obligation Modal */
interface AddFixedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, amount: number, category: FixedObligationCategory, notes?: string) => void;
}

export const AddFixedObligationModal: React.FC<AddFixedModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('سكن وإيجار');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    onSave(title.trim(), parseFloat(amount), category);
    setTitle('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--ink-faint)] rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-[var(--ink-faint)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[var(--surface-light)] border border-[var(--ink-faint)] text-blue-400 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[var(--ink)] text-sm">إضافة التزام شهري ثابت</h3>
          </div>
          <button onClick={onClose} className="cursor-pointer text-[var(--ink-muted)] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="label-mono block mb-1">اسم الالتزام</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: إيجار، بنزين، كهرباء..."
              className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-blue-400 text-[var(--ink)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="label-mono block mb-1">المبلغ (ر.س)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-blue-400 font-mono num-ltr text-[var(--ink)]"
              />
            </div>
            <div>
              <label className="label-mono block mb-1">التصنيف</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-blue-400 text-[var(--ink)]"
              >
                <option value="سكن وإيجار">سكن وإيجار</option>
                <option value="بنزين وتشغيل">بنزين وتشغيل</option>
                <option value="سيارة">سيارة</option>
                <option value="فواتير منزل">فواتير منزل</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-[var(--ink-faint)]">
            <button type="button" onClick={onClose} className="cursor-pointer px-3 py-1.5 border border-[var(--ink-faint)] rounded text-[var(--ink-muted)] hover:text-white">إلغاء</button>
            <button type="submit" className="cursor-pointer px-4 py-1.5 bg-blue-600 hover:brightness-110 text-white font-bold rounded">حفظ الالتزام</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* 5. Add Savings Modal */
interface AddSavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, amount: number, category: SavingsCategory, notes?: string) => void;
}

export const AddSavingsModal: React.FC<AddSavingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('مخصص الدفعة الأخيرة للسيارة');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    onSave(title.trim(), parseFloat(amount), category);
    setTitle('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--ink-faint)] rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-[var(--ink-faint)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[var(--surface-light)] border border-[var(--ink-faint)] text-[var(--accent)] flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[var(--ink)] text-sm">إيداع ادخار أو أصول جديدة</h3>
          </div>
          <button onClick={onClose} className="cursor-pointer text-[var(--ink-muted)] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="label-mono block mb-1">اسم مخصص الادخار</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مخصص دفعة السيارة، صندوق طوارئ..."
              className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-[var(--accent)] text-[var(--ink)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="label-mono block mb-1">المبلغ المحول (ر.س)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-[var(--accent)] font-mono num-ltr text-[var(--ink)]"
              />
            </div>
            <div>
              <label className="label-mono block mb-1">التصنيف</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-[var(--accent)] text-[var(--ink)]"
              >
                <option value="مخصص الدفعة الأخيرة للسيارة">مخصص الدفعة الأخيرة للسيارة</option>
                <option value="صندوق طوارئ">صندوق طوارئ</option>
                <option value="استثمار ونمو">استثمار ونمو</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-[var(--ink-faint)]">
            <button type="button" onClick={onClose} className="cursor-pointer px-3 py-1.5 border border-[var(--ink-faint)] rounded text-[var(--ink-muted)] hover:text-white">إلغاء</button>
            <button type="submit" className="cursor-pointer px-4 py-1.5 bg-[var(--accent)] hover:brightness-110 text-black font-bold rounded">حفظ الإيداع</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* 6. Add Receivable Modal */
interface AddReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, amount: number, notes?: string) => void;
}

export const AddReceivableModal: React.FC<AddReceivableModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    onSave(name.trim(), parseFloat(amount));
    setName('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--ink-faint)] rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-[var(--ink-faint)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[var(--surface-light)] border border-[var(--ink-faint)] text-[var(--warning)] flex items-center justify-center">
              <HandCoins className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[var(--ink)] text-sm">تسجيل مستحق لك لدى الغير</h3>
          </div>
          <button onClick={onClose} className="cursor-pointer text-[var(--ink-muted)] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="label-mono block mb-1">اسم الشخص أو الجهة</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: عبدالله، صديق، عميل..."
              className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-[var(--warning)] text-[var(--ink)]"
            />
          </div>

          <div>
            <label className="label-mono block mb-1">المبلغ المطلوب (ر.س)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-[var(--warning)] font-mono num-ltr text-[var(--ink)]"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-[var(--ink-faint)]">
            <button type="button" onClick={onClose} className="cursor-pointer px-3 py-1.5 border border-[var(--ink-faint)] rounded text-[var(--ink-muted)] hover:text-white">إلغاء</button>
            <button type="submit" className="cursor-pointer px-4 py-1.5 bg-[var(--warning)] hover:brightness-110 text-black font-bold rounded">حفظ المستحق</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* 7. Add Liability Modal */
interface AddLiabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, amount: number, dueDate: string, category: LiabilityCategory, notes?: string) => void;
}

export const AddLiabilityModal: React.FC<AddLiabilityModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('2028-08-01');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    onSave(title.trim(), parseFloat(amount), dueDate, 'التزام مؤجل');
    setTitle('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--ink-faint)] rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-[var(--ink-faint)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[var(--surface-light)] border border-[var(--ink-faint)] text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[var(--ink)] text-sm">تسجيل التزام أو دين مؤجل عليك</h3>
          </div>
          <button onClick={onClose} className="cursor-pointer text-[var(--ink-muted)] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="label-mono block mb-1">اسم الالتزام</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: دفعة مؤجلة، دين شخصي..."
              className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-rose-400 text-[var(--ink)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="label-mono block mb-1">المبلغ المطلوب (ر.س)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-rose-400 font-mono num-ltr text-[var(--ink)]"
              />
            </div>
            <div>
              <label className="label-mono block mb-1">تاريخ الاستحقاق</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#0c0c0e] border border-[var(--ink-faint)] rounded p-2 outline-none focus:border-rose-400 font-mono num-ltr text-[var(--ink)]"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-[var(--ink-faint)]">
            <button type="button" onClick={onClose} className="cursor-pointer px-3 py-1.5 border border-[var(--ink-faint)] rounded text-[var(--ink-muted)] hover:text-white">إلغاء</button>
            <button type="submit" className="cursor-pointer px-4 py-1.5 bg-rose-600 hover:brightness-110 text-white font-bold rounded">حفظ الالتزام</button>
          </div>
        </form>
      </div>
    </div>
  );
};
