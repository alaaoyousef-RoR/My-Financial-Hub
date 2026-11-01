import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinancialState } from '../context/FinancialContext';
import { 
  Wallet, 
  Plus, 
  CreditCard, 
  Upload, 
  RotateCcw, 
  PieChart, 
  Layers, 
  Receipt, 
  PiggyBank, 
  HandCoins, 
  Car, 
  Printer,
  Sun,
  Moon,
  CalendarDays,
  User,
  FlaskConical,
  LogOut,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface HeaderGreetingTimeProps {
  userName?: string;
}

/**
 * Lightweight, self-updating Greeting & Live Date/Time Widget.
 * Encapsulates the 1-second interval so the main Navbar and Dashboard don't re-render.
 */
const HeaderGreetingTime: React.FC<HeaderGreetingTimeProps> = ({ userName = 'علاء' }) => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours();
  let timeOfDayGreeting = 'صباح الخير';
  let GreetingIcon = Sun;
  let greetingColor = 'text-amber-400';

  if (hour >= 12 && hour < 17) {
    timeOfDayGreeting = 'طاب يومك';
    GreetingIcon = Sun;
    greetingColor = 'text-amber-400';
  } else if (hour >= 17 || hour < 5) {
    timeOfDayGreeting = 'مساء الخير';
    GreetingIcon = Moon;
    greetingColor = 'text-indigo-400';
  }

  // Format date cleanly in Arabic (e.g. "الإثنين، 5 أكتوبر 2026")
  const formattedDate = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);

  // Format time: HH:mm:ss
  const hoursStr = String(now.getHours()).padStart(2, '0');
  const minutesStr = String(now.getMinutes()).padStart(2, '0');
  const secondsStr = String(now.getSeconds()).padStart(2, '0');
  const timeString = `${hoursStr}:${minutesStr}:${secondsStr}`;

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl px-2.5 sm:px-3.5 py-1.5 transition-all shadow-xs shrink-0 font-['Readex_Pro',sans-serif]">
      {/* User Greeting Pill */}
      <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[var(--glass-border)]">
        <div className="w-7 h-7 rounded-xl bg-[var(--accent-glow)] border border-[var(--accent)]/40 text-[var(--accent)] flex items-center justify-center text-xs shrink-0 shadow-xs">
          <User className="w-3.5 h-3.5" />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-[var(--ink)] tracking-tight">أهلاً، {userName}</span>
            <GreetingIcon className={`w-3 h-3 ${greetingColor}`} />
          </div>
          <span className="text-[10px] text-[var(--ink-muted)] block mt-0.5 font-normal">
            {timeOfDayGreeting}
          </span>
        </div>
      </div>

      {/* Live Date & Time Display */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="text-right hidden lg:block">
          <div className="flex items-center gap-1 text-[11px] font-medium text-[var(--ink-muted)]">
            <CalendarDays className="w-3 h-3 text-[var(--accent)] shrink-0" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Live Clock with pulsing green sync indicator */}
        <div className="flex items-center gap-1.5 bg-black/40 border border-[var(--glass-border)] px-2 py-0.5 rounded-lg shadow-inner" title="التوقيت الحي المتزامن">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-xs font-bold text-[var(--accent)] num-ltr tracking-wider">
            {timeString}
          </span>
        </div>
      </div>
    </div>
  );
};

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenExpenseModal: () => void;
  onOpenInstallmentModal: () => void;
  onOpenReceivableModal: () => void;
  onOpenIncomeModal: () => void;
  onOpenSavingsModal: () => void;
  onExportJSON?: () => void;
  onExportHTML?: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  onResetToZero?: () => void;
  onPrint: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenExpenseModal,
  onOpenInstallmentModal,
  onOpenReceivableModal,
  onOpenIncomeModal,
  onOpenSavingsModal,
  onImport,
  onReset,
  onResetToZero,
  onPrint
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();
  const { saveStatus } = useFinancialState();

  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم والتحليل', icon: PieChart },
    { id: 'income_fixed', label: 'الإيرادات والالتزامات الثابتة', icon: Car },
    { id: 'installments', label: 'أقساط الدفع الآجل (تمارا وتابي)', icon: Layers },
    { id: 'expenses', label: 'المصروف الشخصي اليومي', icon: Receipt },
    { id: 'savings', label: 'الادخار وبناء الأصول', icon: PiggyBank },
    { id: 'liabilities', label: 'الديون والمستحقات', icon: HandCoins }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="sticky top-0 z-40 print:hidden select-none">
      {/* Floating Header */}
      <header className="glass-panel mx-3 sm:mx-6 mt-3 sm:mt-4 p-3 sm:px-6 flex flex-wrap justify-between items-center gap-3.5">
        
        {/* Brand & Greeting Section */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-glow)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] shrink-0 shadow-sm">
              <Wallet className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-[var(--ink)] leading-tight tracking-tight">
                  مركز الإدارة المالية الشخصية
                </h1>
              </div>
              <div className="label-mono font-bold text-[var(--accent)] text-[10px] mt-0.5">
                MY FINANCIAL HUB
              </div>
            </div>
          </div>

          {/* User Welcome Greeting + Live Dynamic Date/Time Widget */}
          <HeaderGreetingTime userName="علاء" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={onOpenExpenseModal}
            className="btn btn-primary text-xs sm:text-sm shadow-xs"
            title="تسجيل مصروف شخصي جديد (+ صرف جديد)"
          >
            <Plus className="w-4 h-4" />
            <span>+ صرف جديد</span>
          </button>

          <button
            onClick={onOpenInstallmentModal}
            className="btn btn-secondary text-xs sm:text-sm shadow-xs"
            title="إضافة قسط تمارا أو تابي جديد"
          >
            <CreditCard className="w-4 h-4" />
            <span>+ قسط جديد</span>
          </button>

          <button
            onClick={onOpenSavingsModal}
            className="btn btn-secondary text-xs sm:text-sm shadow-xs border-emerald-500/30 text-emerald-300"
            title="تسجيل إيداع ادخار أو استثمار جديد (+ إيداع ادخار)"
          >
            <PiggyBank className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">+ إيداع ادخار</span>
          </button>

          <div className="h-6 w-px bg-[var(--glass-border)] mx-1 hidden sm:block"></div>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="استيراد نسخة احتياطية JSON"
            className="btn btn-ghost p-2 text-[var(--ink-muted)] hover:text-white"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />

          <button
            onClick={onPrint}
            title="طباعة التقرير"
            className="btn btn-ghost p-2 text-[var(--ink-muted)] hover:text-white hidden sm:inline-flex"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Auto-save Status Indicator */}
          <div 
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-xs select-none transition-all duration-200 ${
              saveStatus === 'saving'
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                : saveStatus === 'error'
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            }`}
            title={
              saveStatus === 'saving'
                ? 'جاري تفادي المزامنة المتكررة وحفظ التغييرات...'
                : 'جميع التغييرات تُحفظ تلقائياً في المتصفح والسحابة'
            }
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>جاري الحفظ...</span>
              </>
            ) : saveStatus === 'error' ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>خطأ في الحفظ السحابي</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                <span>تم الحفظ تلقائياً</span>
              </>
            )}
          </div>

          <button
            onClick={onReset}
            title="إعادة الضبط واستعادة القالب الافتراضي"
            className="btn btn-ghost p-2 text-[var(--danger)]/80 hover:text-[var(--danger)] hover:bg-[rgba(255,77,77,0.15)] rounded-xl"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* User Account Profile & Sign Out */}
          {user && (
            <div className="flex items-center gap-2 bg-[#090e1a] border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center text-[10px] border border-blue-500/30">
                {user.email ? user.email[0].toUpperCase() : 'U'}
              </div>
              <span className="text-slate-300 hidden md:inline max-w-[130px] truncate" title={user.email || ''}>
                {user.email}
              </span>
              <button
                onClick={logout}
                title="تسجيل الخروج"
                className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition cursor-pointer flex items-center gap-1 font-bold text-[11px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تسجيل خروج</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Floating Pill Navigation */}
      <nav className="mx-3 sm:mx-6 mt-3 flex gap-2 overflow-x-auto pb-1 custom-scroll">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--ink-muted)]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
