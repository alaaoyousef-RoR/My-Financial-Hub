import React from 'react';
import { ReceivableRecord } from '../types/finance';
import { formatCurrency, triggerCelebration } from '../utils/formatters';
import { 
  Plus, 
  CheckCircle, 
  Clock, 
  Trash2, 
  RotateCcw, 
  HandCoins, 
  ArrowDownLeft, 
  Coins,
  ShieldCheck
} from 'lucide-react';

interface ReceivablesViewProps {
  receivables: ReceivableRecord[];
  onAddClick: () => void;
  onToggleCollected: (id: string) => void;
  onDeleteReceivable: (id: string) => void;
}

export const ReceivablesView: React.FC<ReceivablesViewProps> = ({
  receivables,
  onAddClick,
  onToggleCollected,
  onDeleteReceivable
}) => {
  const pendingItems = receivables.filter(r => r.status === 'معلق');
  const collectedItems = receivables.filter(r => r.status === 'تم التحصيل');

  const pendingTotal = pendingItems.reduce((acc, r) => acc + r.amount, 0);
  const collectedTotal = collectedItems.reduce((acc, r) => acc + r.amount, 0);

  const handleCollect = (id: string, currentStatus: string) => {
    onToggleCollected(id);
    if (currentStatus === 'معلق') {
      triggerCelebration();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-lg">المبالغ المستحقة لك لدى الغير (ديون السوق)</h2>
            <span className="text-xs bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
              سيولة مؤجلة
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            سجل المبالغ التي أقرضتها أو مستحقات أعمال معلقة لم يتم تحصيلها بعد
          </p>
        </div>

        <button
          onClick={onAddClick}
          className="cursor-pointer bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مستحق جديد</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Pending total */}
        <div className="bg-white p-4 rounded-xl border border-amber-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-800 font-medium">مستحقات معلقة حالياً</span>
            <p className="text-2xl font-bold font-mono text-amber-600 num-ltr mt-1">
              {formatCurrency(pendingTotal)} <span className="font-sans text-xs text-slate-500">ر.س</span>
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block"><span className="num-ltr font-mono">{pendingItems.length}</span> جهات معلقة</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Collected total */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-800 font-medium">تم تحصيلها بنجاح</span>
            <p className="text-2xl font-bold font-mono text-emerald-600 num-ltr mt-1">
              {formatCurrency(collectedTotal)} <span className="font-sans text-xs text-slate-500">ر.س</span>
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block"><span className="num-ltr font-mono">{collectedItems.length}</span> مستحقات محصلة</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Impact advice card */}
        <div className="bg-gradient-to-tr from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-indigo-900 font-bold">أثر التحصيل على الأقساط</span>
            <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
              تحصيل المستحقات المعلقة (<span className="num-ltr font-mono">{formatCurrency(pendingTotal)}</span> ر.س) يكفي لتسديد أكثر من <strong>شهرين كاملين</strong> من أقساط تمارا وتابي فوراً!
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mr-2">
            <Coins className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Receivables Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">الجهة / الشخص</th>
                <th className="p-3.5 text-center">المبلغ المستحق</th>
                <th className="p-3.5 text-center">الحالة</th>
                <th className="p-3.5 text-center">تاريخ القيد</th>
                <th className="p-3.5">ملاحظات</th>
                <th className="p-3.5 text-center">إجراء التحصيل</th>
                <th className="p-3.5 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {receivables.map((item) => {
                const isCollected = item.status === 'تم التحصيل';

                return (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50 transition-colors ${
                      isCollected ? 'bg-emerald-50/20 text-slate-500' : ''
                    }`}
                  >
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isCollected ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                      <span>{item.name}</span>
                    </td>

                    <td className="p-3.5 text-center font-bold font-mono text-slate-900 whitespace-nowrap">
                      <span className={`num-ltr ${isCollected ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {formatCurrency(item.amount)} <span className="font-sans text-xs">ر.س</span>
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        isCollected 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-center text-xs text-slate-500 font-mono num-ltr">
                      {item.date || '-'}
                    </td>

                    <td className="p-3.5 text-xs text-slate-500 max-w-xs truncate">
                      {item.notes || '-'}
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleCollect(item.id, item.status)}
                        className={`cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 mx-auto transition ${
                          isCollected
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                        }`}
                      >
                        {isCollected ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>إلغاء التحصيل</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>تم التحصيل ✅</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onDeleteReceivable(item.id)}
                        className="cursor-pointer p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                        title="حذف المستحق"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
