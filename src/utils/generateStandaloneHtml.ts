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

export function generateStandaloneHtml(data: {
  incomes: IncomeItem[];
  carPlan: CarPlan;
  fixedObligations: FixedObligation[];
  installments: InstallmentRecord[];
  expenses: ExpenseRecord[];
  savings: SavingsItem[];
  liabilities: LiabilityItem[];
  receivables: ReceivableRecord[];
  monthlyData: MonthlyRecord[];
}): string {
  const jsonStr = JSON.stringify(data);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مركز الإدارة المالية الشخصية | My Financial Hub</title>
  
  <!-- Fonts: Readex Pro + Geist Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Readex Pro', 'sans-serif'],
          }
        }
      }
    }
  </script>

  <style>
    :root {
      --bg: #09090b;
      --glass: rgba(255, 255, 255, 0.05);
      --glass-hover: rgba(255, 255, 255, 0.08);
      --glass-thick: rgba(255, 255, 255, 0.1);
      --glass-border: rgba(255, 255, 255, 0.13);
      --ink: #ffffff;
      --ink-muted: rgba(255, 255, 255, 0.65);
      --accent-green: #10b981;
      --accent-green-glow: rgba(16, 185, 129, 0.2);
      --accent-red: #f43f5e;
      --accent-blue: #3b82f6;
      --accent-amber: #fbbf24;
      --accent-purple: #818cf8;
    }

    *, ::before, ::after {
      font-family: 'Readex Pro', sans-serif !important;
      font-variant-numeric: tabular-nums;
      -webkit-font-feature-settings: "lnum" 1, "tnum" 1;
      font-feature-settings: "lnum" 1, "tnum" 1;
    }

    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 40%);
      background-attachment: fixed;
      color: var(--ink);
      font-family: 'Readex Pro', sans-serif !important;
      min-height: 100vh;
    }

    body, button, input, select, textarea {
      font-family: 'Readex Pro', sans-serif !important;
    }

    .font-mono, .label-mono, .num-ltr {
      font-family: 'Geist Mono', 'Readex Pro', monospace !important;
    }

    .num-ltr {
      direction: ltr;
      display: inline-block;
      unicode-bidi: embed;
    }

    .glass-panel {
      background: var(--glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border);
      border-radius: 16px;
    }

    .custom-scroll::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    .custom-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }
  </style>
</head>
<body class="antialiased min-h-screen flex flex-col selection:bg-emerald-500 selection:text-black">

  <!-- Floating Glass Header -->
  <header class="glass-panel mx-3 sm:mx-6 mt-3 sm:mt-4 p-3 sm:px-6 flex flex-wrap justify-between items-center gap-3 sticky top-2 z-40 print:hidden shadow-2xl">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-lg shrink-0 shadow-sm">
        <i class="fa-solid fa-wallet"></i>
      </div>
      <div>
        <h1 class="font-extrabold text-base sm:text-lg text-white leading-tight">مركز الإدارة المالية الشخصية</h1>
        <p class="text-xs text-white/60 font-medium">الهيكلة المحاسبية الصارمة · الحفظ التلقائي في المتصفح</p>
      </div>
    </div>

    <!-- Quick Actions in Header -->
    <div class="flex items-center gap-2 flex-wrap">
      <button onclick="openModal('addExpenseModal')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm">
        <i class="fa-solid fa-plus"></i>
        <span>+ صرف جديد</span>
      </button>
      <button onclick="openModal('addInstallmentModal')" class="bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition border border-rose-500/40 shadow-sm">
        <i class="fa-solid fa-plus"></i>
        <span>+ قسط جديد</span>
      </button>
      <button onclick="openModal('addSavingsModal')" class="bg-purple-600/80 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition border border-purple-500/40 shadow-sm">
        <i class="fa-solid fa-piggy-bank"></i>
        <span>+ إيداع ادخار</span>
      </button>

      <div class="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>

      <button onclick="exportData()" class="p-2 text-white/70 hover:text-white border border-white/15 rounded-xl hover:bg-white/5 transition" title="تصدير نسخة احتياطية JSON">
        <i class="fa-solid fa-download"></i>
      </button>
      <button onclick="document.getElementById('importFile').click()" class="p-2 text-white/70 hover:text-white border border-white/15 rounded-xl hover:bg-white/5 transition" title="استيراد نسخة احتياطية JSON">
        <i class="fa-solid fa-upload"></i>
      </button>
      <input type="file" id="importFile" accept=".json" class="hidden" onchange="importData(event)">
      <button onclick="resetData()" class="p-2 text-rose-400 hover:text-rose-300 border border-white/15 rounded-xl hover:bg-white/5 transition" title="استعادة البيانات الافتراضية">
        <i class="fa-solid fa-rotate-left"></i>
      </button>
    </div>
  </header>

  <!-- 6 Strict Architectural Navigation Tabs -->
  <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 w-full">
    <div class="glass-panel p-1.5 flex gap-1.5 overflow-x-auto custom-scroll text-xs sm:text-sm font-semibold select-none">
      <button onclick="switchTab('dashboard')" id="tab-dashboard" class="tab-btn flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 whitespace-nowrap transition bg-white/15 text-emerald-400 font-bold shadow-xs">
        <i class="fa-solid fa-chart-pie"></i> 1. لوحة التحكم والتحليل
      </button>
      <button onclick="switchTab('income_fixed')" id="tab-income_fixed" class="tab-btn flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 whitespace-nowrap transition text-white/60 hover:text-white hover:bg-white/5">
        <i class="fa-solid fa-car"></i> 2. الإيرادات والالتزامات الثابتة
      </button>
      <button onclick="switchTab('installments')" id="tab-installments" class="tab-btn flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 whitespace-nowrap transition text-white/60 hover:text-white hover:bg-white/5">
        <i class="fa-solid fa-layer-group"></i> 3. أقساط تمارا وتابي
      </button>
      <button onclick="switchTab('expenses')" id="tab-expenses" class="tab-btn flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 whitespace-nowrap transition text-white/60 hover:text-white hover:bg-white/5">
        <i class="fa-solid fa-receipt"></i> 4. المصروف الشخصي اليومي
      </button>
      <button onclick="switchTab('savings')" id="tab-savings" class="tab-btn flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 whitespace-nowrap transition text-white/60 hover:text-white hover:bg-white/5">
        <i class="fa-solid fa-piggy-bank"></i> 5. الادخار وبناء الأصول
      </button>
      <button onclick="switchTab('liabilities')" id="tab-liabilities" class="tab-btn flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 whitespace-nowrap transition text-white/60 hover:text-white hover:bg-white/5">
        <i class="fa-solid fa-hand-holding-dollar"></i> 6. الديون والمستحقات
      </button>
    </div>
  </nav>

  <!-- Main Content Container -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 w-full space-y-5">

    <!-- ========================================== -->
    <!-- TAB 1: لوحة التحكم والتحليل -->
    <!-- ========================================== -->
    <section id="view-dashboard" class="space-y-5">
      
      <!-- 4 Semantic KPI Indicators -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" id="kpiGrid">
        <!-- Rendered via JS -->
      </div>

      <!-- Car Countdown & Financial Freedom Milestone (2 Cards) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        <!-- Car Counter Card (Blue Theme) -->
        <div class="glass-panel p-5 space-y-3.5 border-blue-500/30">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                <i class="fa-solid fa-car"></i>
              </div>
              <div>
                <h3 class="font-bold text-xs sm:text-sm text-white">عداد تمويل السيارة (60 قسطاً)</h3>
                <p class="text-[11px] text-white/60">القسط الشهري: <strong class="font-mono text-white num-ltr" id="carInstallmentVal">2,175</strong> ر.س</p>
              </div>
            </div>

            <button onclick="payCarInstallment()" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm" title="سداد قسط هذا الشهر وزيادة العداد (+1)">
              <i class="fa-solid fa-check-circle"></i>
              <span>+ سداد قسط الآن</span>
            </button>
          </div>

          <div class="space-y-1.5">
            <div class="flex justify-between text-xs">
              <span class="text-white/60">
                تم سداد <strong class="font-mono text-white num-ltr font-bold" id="carPaidDisplay">38</strong> من أصل <strong class="font-mono text-white num-ltr">60</strong> قسطاً
              </span>
              <span class="text-blue-400 font-mono font-bold num-ltr" id="carPctDisplay">63%</span>
            </div>
            <div class="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/15">
              <div id="carProgressBar" class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-emerald-400" style="width: 63%;"></div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
            <div class="bg-black/30 p-2.5 rounded-xl border border-white/10">
              <span class="text-[10px] font-mono text-amber-400 uppercase block">الأقساط المتبقية</span>
              <span class="text-sm font-bold font-mono text-amber-400 num-ltr block mt-0.5" id="carRemainingDisplay">22 شهراً</span>
            </div>
            <div class="bg-black/30 p-2.5 rounded-xl border border-white/10">
              <span class="text-[10px] font-mono text-purple-400 uppercase block">الدفعة الأخيرة (37k)</span>
              <span class="text-sm font-bold font-mono text-purple-400 num-ltr block mt-0.5">37,000 <small class="text-[10px] text-white/50">ر.س</small></span>
            </div>
          </div>
        </div>

        <!-- BNPL Freedom Countdown (Purple Theme) -->
        <div class="glass-panel p-5 space-y-3.5 border-purple-500/30">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/40 text-purple-400 flex items-center justify-center">
                <i class="fa-solid fa-flag-checkered"></i>
              </div>
              <div>
                <h3 class="font-bold text-xs sm:text-sm text-white">عداد التحرر المالي (BNPL Freedom)</h3>
                <p class="text-[11px] text-white/60">موعد الصفرية الكاملة لأقساط تمارا وتابي</p>
              </div>
            </div>

            <span class="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold">
              Mar-27
            </span>
          </div>

          <div class="bg-purple-950/20 border border-purple-500/30 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span class="text-[10px] font-mono text-purple-300 uppercase block">الوفر الشهري الإضافي المرتقب:</span>
              <p class="text-lg font-bold font-mono text-purple-400 num-ltr mt-0.5" id="freedomSavingsDisplay">
                +2,825.68 <small class="text-xs text-white/60">ر.س / شهرياً</small>
              </p>
            </div>
            <div class="text-left font-mono">
              <span class="text-2xl font-extrabold text-emerald-400 num-ltr" id="freedomMonthsCount">6</span>
              <span class="text-[11px] text-white/60 block">أشهر متبقية</span>
            </div>
          </div>

          <p class="text-[11px] text-white/60 leading-relaxed pt-1 border-t border-white/10">
            🎯 بمجرد وصول شهر <strong>إبريل 2027</strong>، ستصبح التزامات تمارا وتابي <strong>0.00 ر.س</strong>، مما يرفع فائضك الحر التلقائي إلى أكثر من <strong>1,725 ريال</strong> كل شهر!
          </p>
        </div>

      </div>

      <!-- Cashflow Equation Pipeline -->
      <div class="glass-panel p-5 space-y-3" id="pipelineBox">
        <!-- Rendered via JS -->
      </div>

      <!-- Interactive Chart: Drop in Commitments & Rise in Free Cash -->
      <div class="glass-panel p-5 space-y-4">
        <div class="flex justify-between items-center border-b border-white/10 pb-3">
          <div>
            <h3 class="font-extrabold text-sm sm:text-base text-white">مسار انخفاض الأقساط ونمو الصافي المتاح (2026-2027)</h3>
            <p class="text-xs text-white/60">مخطط تفاعلي يوضح تراجع التزامات تمارا وتابي حتى التحرر الكامل في مارس 2027</p>
          </div>
          <span class="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
            مسار التحرر
          </span>
        </div>

        <div id="chartContainer" class="w-full overflow-x-auto custom-scroll">
          <!-- Rendered via JS SVG -->
        </div>
      </div>

      <!-- Monthly Forecast Table (2026-2028) -->
      <div class="glass-panel overflow-hidden">
        <div class="p-4 border-b border-white/10 flex justify-between items-center">
          <h3 class="font-bold text-sm text-white">جدول التدفق المالي الشهري الشامل (2026-2028)</h3>
          <span class="text-xs text-white/50 font-mono">15 MONTHS FORECAST</span>
        </div>
        <div class="overflow-x-auto custom-scroll">
          <table class="w-full text-right text-xs">
            <thead class="bg-white/5 text-white/70 font-semibold border-b border-white/10">
              <tr>
                <th class="p-3">الشهر</th>
                <th class="p-3 text-center">الراتب</th>
                <th class="p-3 text-center text-blue-400">السيارة</th>
                <th class="p-3 text-center">السكن</th>
                <th class="p-3 text-center">البنزين</th>
                <th class="p-3 text-center text-rose-400">تمارا</th>
                <th class="p-3 text-center text-emerald-400">تابي</th>
                <th class="p-3 text-center font-bold text-rose-300">إجمالي الالتزام</th>
                <th class="p-3 text-center font-bold text-emerald-300">الصافي المتاح</th>
              </tr>
            </thead>
            <tbody id="monthlyTableBody" class="divide-y divide-white/5 text-white/80">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </div>

    </section>

    <!-- ========================================== -->
    <!-- TAB 2: الإيرادات والالتزامات الثابتة -->
    <!-- ========================================== -->
    <section id="view-income_fixed" class="hidden space-y-5">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="font-extrabold text-base sm:text-lg text-white">الباب الثاني: الإيرادات والالتزامات الثابتة</h2>
          <p class="text-xs text-white/60">تعديل الراتب، قسط السيارة (2,175)، السكن (500)، والبنزين (600)</p>
        </div>
        <div class="flex gap-2">
          <button onclick="openModal('addIncomeModal')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition">
            <i class="fa-solid fa-plus"></i> إضافة دخل
          </button>
          <button onclick="openModal('addFixedModal')" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition">
            <i class="fa-solid fa-plus"></i> إضافة التزام ثابت
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5" id="incomeFixedContainer">
        <!-- Rendered via JS -->
      </div>
    </section>

    <!-- ========================================== -->
    <!-- TAB 3: أقساط الدفع الآجل (تمارا وتابي) -->
    <!-- ========================================== -->
    <section id="view-installments" class="hidden space-y-5">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 class="font-extrabold text-base sm:text-lg text-white">الباب الثالث: أقساط الدفع الآجل (تمارا وتابي)</h2>
          <p class="text-xs text-white/60">تفصيل Mokab، max، center، المطار، الآيفون وموبايلي مع حساب المتبقي تلقائياً</p>
        </div>
        <button onclick="openModal('addInstallmentModal')" class="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm">
          <i class="fa-solid fa-plus"></i> إضافة قسط جديد
        </button>
      </div>

      <!-- Filters & Summary -->
      <div class="glass-panel p-3.5 flex flex-wrap justify-between items-center gap-3">
        <div class="flex gap-2">
          <button onclick="filterInstallments('all')" id="btn-inst-all" class="px-3 py-1 rounded-lg text-xs font-bold bg-white/15 text-white">الكل</button>
          <button onclick="filterInstallments('Tamara')" id="btn-inst-tamara" class="px-3 py-1 rounded-lg text-xs font-bold text-rose-400 hover:bg-white/5">تمارا</button>
          <button onclick="filterInstallments('Tabby')" id="btn-inst-tabby" class="px-3 py-1 rounded-lg text-xs font-bold text-emerald-400 hover:bg-white/5">تابي</button>
        </div>
        <div class="text-xs font-mono">
          <span class="text-white/60">إجمالي الأقساط النشطة:</span> <strong class="text-rose-400 font-bold num-ltr" id="totalActiveInstDisplay">0.00</strong> ر.س
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5" id="installmentsGrid">
        <!-- Rendered via JS -->
      </div>
    </section>

    <!-- ========================================== -->
    <!-- TAB 4: سجل المصروف الشخصي اليومي -->
    <!-- ========================================== -->
    <section id="view-expenses" class="hidden space-y-5">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="font-extrabold text-base sm:text-lg text-white">الباب الرابع: المصروف الشخصي اليومي</h2>
            <span class="text-[10px] text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
              وين راح ووين أجا
            </span>
          </div>
          <p class="text-xs text-white/60 mt-0.5">تسجيل فوري للمصاريف اليومية، القهوة، المطاعم، والمشتريات</p>
        </div>
        <button onclick="openModal('addExpenseModal')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm">
          <i class="fa-solid fa-plus"></i> تسجيل عملية صرف
        </button>
      </div>

      <!-- Quick 1-Click Logging Buttons -->
      <div class="glass-panel p-4 space-y-2.5">
        <span class="text-xs font-bold text-white/80 block">تسجيل سريع بنقرة واحدة:</span>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button onclick="quickAddExp('قهوة يومية', 18, 'طعام ومقاهي', 'أبل باي (Apple Pay)')" class="p-2.5 rounded-xl border border-white/10 bg-black/25 hover:bg-white/10 text-right transition flex items-center gap-2">
            <i class="fa-solid fa-mug-hot text-amber-400"></i>
            <div>
              <p class="text-xs font-bold text-white">قهوة يومية</p>
              <span class="text-[10px] text-emerald-400 font-mono num-ltr">18 ر.س</span>
            </div>
          </button>
          <button onclick="quickAddExp('وجبة غداء', 45, 'طعام ومقاهي', 'مدى / بطاقة بنكية')" class="p-2.5 rounded-xl border border-white/10 bg-black/25 hover:bg-white/10 text-right transition flex items-center gap-2">
            <i class="fa-solid fa-utensils text-rose-400"></i>
            <div>
              <p class="text-xs font-bold text-white">وجبة غداء</p>
              <span class="text-[10px] text-emerald-400 font-mono num-ltr">45 ر.س</span>
            </div>
          </button>
          <button onclick="quickAddExp('بنزين سيارة', 100, 'بنزين وسيارة', 'مدى / بطاقة بنكية')" class="p-2.5 rounded-xl border border-white/10 bg-black/25 hover:bg-white/10 text-right transition flex items-center gap-2">
            <i class="fa-solid fa-gas-pump text-blue-400"></i>
            <div>
              <p class="text-xs font-bold text-white">بنزين سيارة</p>
              <span class="text-[10px] text-emerald-400 font-mono num-ltr">100 ر.س</span>
            </div>
          </button>
          <button onclick="quickAddExp('سوبرماركت ومستلزمات', 120, 'سكن ومستلزمات', 'مدى / بطاقة بنكية')" class="p-2.5 rounded-xl border border-white/10 bg-black/25 hover:bg-white/10 text-right transition flex items-center gap-2">
            <i class="fa-solid fa-cart-shopping text-teal-400"></i>
            <div>
              <p class="text-xs font-bold text-white">سوبرماركت</p>
              <span class="text-[10px] text-emerald-400 font-mono num-ltr">120 ر.س</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="glass-panel p-3.5 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div class="relative flex-1">
          <i class="fa-solid fa-magnifying-glass text-white/40 absolute right-3.5 top-3 text-xs"></i>
          <input type="text" id="expenseSearch" oninput="renderExpenses()" placeholder="بحث في المشتريات (مطعم، بنزين، قهوة...)" class="w-full text-xs pr-9 pl-3 py-2 bg-black/40 border border-white/15 rounded-xl outline-none focus:border-emerald-500 text-white">
        </div>
        <div class="bg-rose-500/10 border border-rose-500/30 rounded-xl px-3.5 py-1.5 flex items-center gap-2 shrink-0">
          <span class="text-xs text-rose-400 font-semibold">إجمالي المصروف المسجل:</span>
          <span class="text-xs font-bold font-mono text-rose-400 num-ltr" id="expensesTotalBadge">0.00 ر.س</span>
        </div>
      </div>

      <!-- Expenses Ledger -->
      <div class="glass-panel overflow-hidden">
        <table class="w-full text-right text-xs">
          <thead class="bg-white/5 text-white/70 font-semibold border-b border-white/10">
            <tr>
              <th class="p-3">الوصف</th>
              <th class="p-3 text-center">التصنيف</th>
              <th class="p-3 text-center">طريقة الدفع</th>
              <th class="p-3 text-center">المبلغ</th>
              <th class="p-3 text-center">التاريخ</th>
              <th class="p-3 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody id="expensesTableBody" class="divide-y divide-white/5 text-white/80">
            <!-- Rendered via JS -->
          </tbody>
        </table>
      </div>
    </section>

    <!-- ========================================== -->
    <!-- TAB 5: الادخار وبناء الأصول -->
    <!-- ========================================== -->
    <section id="view-savings" class="hidden space-y-5">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="font-extrabold text-base sm:text-lg text-white">الباب الخامس: الادخار وبناء الأصول</h2>
            <span class="text-[10px] text-purple-400 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/30 font-bold font-mono">
              ISOLATED ASSETS
            </span>
          </div>
          <p class="text-xs text-white/60 mt-0.5">وعاء مستقل تماماً لدفعة السيارة الأخيرة (37k) وصندوق الطوارئ معزول عن المصروف اليومي</p>
        </div>
        <button onclick="openModal('addSavingsModal')" class="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm">
          <i class="fa-solid fa-piggy-bank"></i> إيداع ادخار جديد
        </button>
      </div>

      <!-- 3 Asset Buckets -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5" id="savingsBuckets">
        <!-- Rendered via JS -->
      </div>

      <!-- Savings Ledger -->
      <div class="glass-panel overflow-hidden">
        <div class="p-3.5 border-b border-white/10 flex justify-between items-center">
          <h3 class="font-bold text-xs sm:text-sm text-white">سجل التحويل للادخار والاستثمار</h3>
          <span class="text-xs text-purple-400 font-mono font-bold" id="savingsCountDisplay">0 RECORDS</span>
        </div>
        <table class="w-full text-right text-xs">
          <thead class="bg-white/5 text-white/70 font-semibold border-b border-white/10">
            <tr>
              <th class="p-3">بند الادخار</th>
              <th class="p-3 text-center">التصنيف</th>
              <th class="p-3 text-center">المبلغ المحول</th>
              <th class="p-3 text-center">التاريخ</th>
              <th class="p-3 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody id="savingsTableBody" class="divide-y divide-white/5 text-white/80">
            <!-- Rendered via JS -->
          </tbody>
        </table>
      </div>
    </section>

    <!-- ========================================== -->
    <!-- TAB 6: الديون والمستحقات -->
    <!-- ========================================== -->
    <section id="view-liabilities" class="hidden space-y-5">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="font-extrabold text-base sm:text-lg text-white">الباب السادس: الديون والمستحقات</h2>
            <span class="text-[10px] text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold font-mono">
              DEBTS & RECEIVABLES
            </span>
          </div>
          <p class="text-xs text-white/60 mt-0.5">فصل صارم بين أموالك المعلقة لدى الغير (لك)، وبين الديون المؤجلة المستحقة عليك (37K للسيارة)</p>
        </div>
        <div class="flex gap-2">
          <button onclick="openModal('addLiabilityModal')" class="bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-3 py-2 rounded-xl transition border border-white/15">
            <i class="fa-solid fa-plus"></i> تسجيل دين عليك
          </button>
          <button onclick="openModal('addReceivableModal')" class="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-2 rounded-xl transition shadow-sm">
            <i class="fa-solid fa-plus"></i> تسجيل مستحق لك
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5" id="liabilitiesReceivablesGrid">
        <!-- Rendered via JS -->
      </div>
    </section>

  </main>

  <!-- ========================================== -->
  <!-- MODALS (All Popups for Instant Data Input) -->
  <!-- ========================================== -->

  <!-- Modal: Add Expense -->
  <div id="addExpenseModal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
    <div class="glass-panel max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 bg-[#09090b]">
      <div class="flex justify-between items-center border-b border-white/10 pb-3">
        <h3 class="font-bold text-white text-base">+ تسجيل مصروف شخصي جديد</h3>
        <button onclick="closeModal('addExpenseModal')" class="text-white/40 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>
      <div class="space-y-3 text-xs">
        <div>
          <label class="block font-semibold mb-1 text-white/80">الوصف</label>
          <input id="expDesc" type="text" placeholder="مثال: قهوة، مطعم، سوبرماركت..." class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-emerald-500 text-white">
        </div>
        <div>
          <label class="block font-semibold mb-1 text-white/80">المبلغ (ر.س)</label>
          <input id="expAmount" type="number" step="0.5" placeholder="0.00" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-emerald-500 text-white font-mono num-ltr">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-semibold mb-1 text-white/80">التصنيف</label>
            <select id="expCategory" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-emerald-500 text-white">
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
            <label class="block font-semibold mb-1 text-white/80">طريقة الدفع</label>
            <select id="expMethod" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-emerald-500 text-white">
              <option value="أبل باي (Apple Pay)">أبل باي (Apple Pay)</option>
              <option value="مدى / بطاقة بنكية">مدى / بطاقة بنكية</option>
              <option value="كاش">كاش</option>
              <option value="تمارا">تمارا</option>
              <option value="تابي">تابي</option>
              <option value="تحويل بنكي">تحويل بنكي</option>
            </select>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button onclick="closeModal('addExpenseModal')" class="px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 rounded-xl">إلغاء</button>
        <button onclick="submitAddExpense()" class="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">حفظ المصروف</button>
      </div>
    </div>
  </div>

  <!-- Modal: Add Installment -->
  <div id="addInstallmentModal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
    <div class="glass-panel max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 bg-[#09090b]">
      <div class="flex justify-between items-center border-b border-white/10 pb-3">
        <h3 class="font-bold text-white text-base">+ إضافة قسط تمارا أو تابي</h3>
        <button onclick="closeModal('addInstallmentModal')" class="text-white/40 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>
      <div class="space-y-3 text-xs">
        <div>
          <label class="block font-semibold mb-1 text-white/80">اسم المتجر أو السلعة</label>
          <input id="instName" type="text" placeholder="مثال: Mokab, max, جرير, الآيفون..." class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-rose-500 text-white">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-semibold mb-1 text-white/80">المنصة</label>
            <select id="instPlatform" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-rose-500 text-white">
              <option value="Tamara">تمارا (Tamara)</option>
              <option value="Tabby">تابي (Tabby)</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold mb-1 text-white/80">القسط الشهري (ر.س)</label>
            <input id="instAmount" type="number" step="0.5" placeholder="0.00" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-rose-500 text-white font-mono num-ltr">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-semibold mb-1 text-white/80">شهر البداية</label>
            <input id="instStart" type="text" placeholder="Oct-26" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-rose-500 text-white font-mono num-ltr">
          </div>
          <div>
            <label class="block font-semibold mb-1 text-white/80">الأشهر المتبقية</label>
            <input id="instRemaining" type="number" placeholder="4" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-rose-500 text-white font-mono num-ltr">
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button onclick="closeModal('addInstallmentModal')" class="px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 rounded-xl">إلغاء</button>
        <button onclick="submitAddInstallment()" class="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl">حفظ القسط</button>
      </div>
    </div>
  </div>

  <!-- Modal: Add Savings -->
  <div id="addSavingsModal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
    <div class="glass-panel max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 bg-[#09090b]">
      <div class="flex justify-between items-center border-b border-white/10 pb-3">
        <h3 class="font-bold text-white text-base">+ إيداع ادخار أو أصول</h3>
        <button onclick="closeModal('addSavingsModal')" class="text-white/40 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>
      <div class="space-y-3 text-xs">
        <div>
          <label class="block font-semibold mb-1 text-white/80">بند الادخار</label>
          <input id="savTitle" type="text" placeholder="مثال: تحويل لمخصص السيارة، صندوق الطوارئ..." class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-purple-500 text-white">
        </div>
        <div>
          <label class="block font-semibold mb-1 text-white/80">المبلغ المحول (ر.س)</label>
          <input id="savAmount" type="number" step="10" placeholder="0.00" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-purple-500 text-white font-mono num-ltr">
        </div>
        <div>
          <label class="block font-semibold mb-1 text-white/80">الوعاء المحاسبي</label>
          <select id="savCategory" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-purple-500 text-white">
            <option value="مخصص الدفعة الأخيرة للسيارة">مخصص الدفعة الأخيرة للسيارة (هدف 37k)</option>
            <option value="صندوق طوارئ">صندوق الطوارئ المحمي</option>
            <option value="استثمار وأسهم">استثمار وأصول</option>
            <option value="ادخار عام">ادخار عام</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button onclick="closeModal('addSavingsModal')" class="px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 rounded-xl">إلغاء</button>
        <button onclick="submitAddSavings()" class="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl">إيداع الادخار</button>
      </div>
    </div>
  </div>

  <!-- Modal: Add Income -->
  <div id="addIncomeModal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
    <div class="glass-panel max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 bg-[#09090b]">
      <div class="flex justify-between items-center border-b border-white/10 pb-3">
        <h3 class="font-bold text-white text-base">+ إضافة مصدر دخل جديد</h3>
        <button onclick="closeModal('addIncomeModal')" class="text-white/40 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>
      <div class="space-y-3 text-xs">
        <div>
          <label class="block font-semibold mb-1 text-white/80">اسم الدخل</label>
          <input id="incTitle" type="text" placeholder="مثال: عمل حر، مكافأة، استثمار..." class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-emerald-500 text-white">
        </div>
        <div>
          <label class="block font-semibold mb-1 text-white/80">المبلغ الشهري (ر.س)</label>
          <input id="incAmount" type="number" placeholder="5000" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-emerald-500 text-white font-mono num-ltr">
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button onclick="closeModal('addIncomeModal')" class="px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 rounded-xl">إلغاء</button>
        <button onclick="submitAddIncome()" class="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">حفظ الدخل</button>
      </div>
    </div>
  </div>

  <!-- Modal: Add Fixed Obligation -->
  <div id="addFixedModal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
    <div class="glass-panel max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 bg-[#09090b]">
      <div class="flex justify-between items-center border-b border-white/10 pb-3">
        <h3 class="font-bold text-white text-base">+ إضافة التزام شهري ثابت</h3>
        <button onclick="closeModal('addFixedModal')" class="text-white/40 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>
      <div class="space-y-3 text-xs">
        <div>
          <label class="block font-semibold mb-1 text-white/80">اسم الالتزام</label>
          <input id="fixTitle" type="text" placeholder="مثال: اشتراك، فواتير إنترنت، صيانة..." class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-blue-500 text-white">
        </div>
        <div>
          <label class="block font-semibold mb-1 text-white/80">المبلغ الشهري (ر.س)</label>
          <input id="fixAmount" type="number" placeholder="200" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-blue-500 text-white font-mono num-ltr">
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button onclick="closeModal('addFixedModal')" class="px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 rounded-xl">إلغاء</button>
        <button onclick="submitAddFixed()" class="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl">حفظ الالتزام</button>
      </div>
    </div>
  </div>

  <!-- Modal: Add Receivable (لك) -->
  <div id="addReceivableModal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
    <div class="glass-panel max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 bg-[#09090b]">
      <div class="flex justify-between items-center border-b border-white/10 pb-3">
        <h3 class="font-bold text-white text-base">+ تسجيل مستحق معلق لك عند الغير</h3>
        <button onclick="closeModal('addReceivableModal')" class="text-white/40 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>
      <div class="space-y-3 text-xs">
        <div>
          <label class="block font-semibold mb-1 text-white/80">الاسم / الشخص</label>
          <input id="recName" type="text" placeholder="مثال: whale, Abdullah, 3day..." class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-amber-500 text-white">
        </div>
        <div>
          <label class="block font-semibold mb-1 text-white/80">المبلغ (ر.س)</label>
          <input id="recAmount" type="number" placeholder="1000" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-amber-500 text-white font-mono num-ltr">
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button onclick="closeModal('addReceivableModal')" class="px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 rounded-xl">إلغاء</button>
        <button onclick="submitAddReceivable()" class="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl">تسجيل المستحق</button>
      </div>
    </div>
  </div>

  <!-- Modal: Add Liability (عليك) -->
  <div id="addLiabilityModal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
    <div class="glass-panel max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 bg-[#09090b]">
      <div class="flex justify-between items-center border-b border-white/10 pb-3">
        <h3 class="font-bold text-white text-base">+ تسجيل دين أو التزام مؤجل عليك</h3>
        <button onclick="closeModal('addLiabilityModal')" class="text-white/40 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>
      <div class="space-y-3 text-xs">
        <div>
          <label class="block font-semibold mb-1 text-white/80">عنوان الدين / الالتزام</label>
          <input id="liabTitle" type="text" placeholder="مثال: سلفة مؤجلة، التزام خاص..." class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-rose-500 text-white">
        </div>
        <div>
          <label class="block font-semibold mb-1 text-white/80">المبلغ (ر.س)</label>
          <input id="liabAmount" type="number" placeholder="5000" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-rose-500 text-white font-mono num-ltr">
        </div>
        <div>
          <label class="block font-semibold mb-1 text-white/80">تاريخ الاستحقاق المتوقع</label>
          <input id="liabDueDate" type="text" placeholder="2027-12-01" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 outline-none focus:border-rose-500 text-white font-mono num-ltr">
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button onclick="closeModal('addLiabilityModal')" class="px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 rounded-xl">إلغاء</button>
        <button onclick="submitAddLiability()" class="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl">حفظ الدين</button>
      </div>
    </div>
  </div>

  <!-- Modal: Route Collected Receivable -->
  <div id="routeReceivableModal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
    <div class="glass-panel max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 bg-[#09090b]">
      <div class="flex items-center gap-2 border-b border-white/10 pb-3">
        <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <i class="fa-solid fa-coins"></i>
        </div>
        <div>
          <h3 class="font-bold text-white text-sm">تخصيص وتوجيه المبلغ المحصل</h3>
          <p class="text-xs text-white/60" id="routeDetailsText"></p>
        </div>
      </div>
      <p class="text-xs text-white/70">اختر الوجهة المحاسبية لإيداع هذا المبلغ في ميزانيتك فوراً:</p>
      <div class="space-y-2">
        <button onclick="confirmRoute('bnpl_payoff')" class="w-full p-3 rounded-xl border border-indigo-500/40 hover:bg-indigo-500/10 text-right transition flex items-center justify-between text-xs">
          <div>
            <strong class="text-indigo-400 block font-bold">1. سداد مبكر لأقساط تمارا وتابي (موصى به)</strong>
            <span class="text-[11px] text-white/50">لتحرير السيولة الشهرية فوراً وتسريع موعد التحرر</span>
          </div>
          <i class="fa-solid fa-arrow-left text-indigo-400"></i>
        </button>
        <button onclick="confirmRoute('savings')" class="w-full p-3 rounded-xl border border-purple-500/40 hover:bg-purple-500/10 text-right transition flex items-center justify-between text-xs">
          <div>
            <strong class="text-purple-400 block font-bold">2. إيداع في مخصص دفعة السيارة الأخيرة (37k)</strong>
            <span class="text-[11px] text-white/50">لتجميع مبلغ الـ 37,000 ريال بأمان قبل حلول أجلها</span>
          </div>
          <i class="fa-solid fa-arrow-left text-purple-400"></i>
        </button>
        <button onclick="confirmRoute('income')" class="w-full p-3 rounded-xl border border-emerald-500/40 hover:bg-emerald-500/10 text-right transition flex items-center justify-between text-xs">
          <div>
            <strong class="text-emerald-400 block font-bold">3. إضافة إلى إيرادات هذا الشهر</strong>
            <span class="text-[11px] text-white/50">كزخّة سيولة نقدية مباشرة ترفع الصافي المتاح</span>
          </div>
          <i class="fa-solid fa-arrow-left text-emerald-400"></i>
        </button>
      </div>
      <div class="flex justify-end pt-1">
        <button onclick="closeModal('routeReceivableModal')" class="px-4 py-1.5 text-xs text-white/60 hover:text-white">إلغاء</button>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/90 text-white border border-emerald-500/50 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl z-50 transition-all opacity-0 pointer-events-none flex items-center gap-2">
    <i class="fa-solid fa-circle-check text-emerald-400"></i>
    <span id="toastText"></span>
  </div>

  <!-- Footer -->
  <footer class="glass-panel mx-3 sm:mx-6 mb-3 sm:mb-4 py-3.5 px-4 sm:px-8 text-xs text-white/50 flex flex-col sm:flex-row justify-between items-center gap-2 print:hidden select-none">
    <div>مركز الإدارة المالية الشخصية الذكي © 2026 · نظام الهيكلة المحاسبية الصارمة</div>
    <div class="font-mono text-emerald-400/80 font-bold">READEX PRO · LOCALSTORAGE PERSISTENT · SINGLE FILE</div>
  </footer>

  <!-- ========================================== -->
  <!-- JAVASCRIPT APP LOGIC & PERSISTENCE -->
  <!-- ========================================== -->
  <script>
    const INITIAL_DATA = ${jsonStr};
    let appData = INITIAL_DATA;

    // Persistent LocalStorage
    const STORAGE_KEY = 'financial_hub_full_store_v2';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        appData = JSON.parse(saved);
      }
    } catch(e) {
      console.warn('LocalStorage error:', e);
    }

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
      } catch(e) {
        console.error('Error saving state:', e);
      }
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      const text = document.getElementById('toastText');
      text.innerText = msg;
      toast.classList.remove('opacity-0', 'pointer-events-none');
      setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none');
      }, 3500);
    }

    function formatNumber(num) {
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
    }

    function switchTab(tabId) {
      document.querySelectorAll('section[id^="view-"]').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-white/15', 'text-emerald-400', 'font-bold', 'shadow-xs');
        btn.classList.add('text-white/60');
      });

      const target = document.getElementById('view-' + tabId);
      if (target) target.classList.remove('hidden');

      const activeBtn = document.getElementById('tab-' + tabId);
      if (activeBtn) {
        activeBtn.classList.remove('text-white/60');
        activeBtn.classList.add('bg-white/15', 'text-emerald-400', 'font-bold', 'shadow-xs');
      }
    }

    function openModal(id) {
      const modal = document.getElementById(id);
      if (modal) modal.classList.remove('hidden');
    }

    function closeModal(id) {
      const modal = document.getElementById(id);
      if (modal) modal.classList.add('hidden');
    }

    // 1. CAR PAY ACTION
    function payCarInstallment() {
      if (appData.carPlan.paidInstallments < appData.carPlan.totalInstallments) {
        appData.carPlan.paidInstallments += 1;
        saveState();
        renderAll();
        showToast('تم سداد قسط السيارة بنجاح (' + appData.carPlan.paidInstallments + '/' + appData.carPlan.totalInstallments + ') 🎉');
      } else {
        alert('تم اكتمال سداد كافة أقساط السيارة!');
      }
    }

    // 2. EXPENSES ACTIONS
    function quickAddExp(desc, amount, category, method) {
      const today = new Date().toISOString().split('T')[0];
      appData.expenses.unshift({
        id: 'exp-' + Date.now(),
        desc,
        amount,
        category,
        method,
        date: today
      });
      saveState();
      renderAll();
      showToast('تم تسجيل صرف: ' + desc + ' (' + amount + ' ر.س)');
    }

    function submitAddExpense() {
      const desc = document.getElementById('expDesc').value.trim();
      const amount = parseFloat(document.getElementById('expAmount').value) || 0;
      const category = document.getElementById('expCategory').value;
      const method = document.getElementById('expMethod').value;

      if (!desc || amount <= 0) {
        alert('يرجى إدخال وصف ومبلغ صحيح');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      appData.expenses.unshift({
        id: 'exp-' + Date.now(),
        desc,
        amount,
        category,
        method,
        date: today
      });

      document.getElementById('expDesc').value = '';
      document.getElementById('expAmount').value = '';
      closeModal('addExpenseModal');
      saveState();
      renderAll();
      showToast('تمت إضافة المصروف بنجاح!');
    }

    function deleteExpense(id) {
      appData.expenses = appData.expenses.filter(e => e.id !== id);
      saveState();
      renderAll();
      showToast('تم حذف المصروف');
    }

    // 3. INSTALLMENTS ACTIONS
    let activeInstFilter = 'all';
    function filterInstallments(platform) {
      activeInstFilter = platform;
      document.getElementById('btn-inst-all').className = platform === 'all' ? 'px-3 py-1 rounded-lg text-xs font-bold bg-white/15 text-white' : 'px-3 py-1 rounded-lg text-xs font-bold text-white/60 hover:bg-white/5';
      document.getElementById('btn-inst-tamara').className = platform === 'Tamara' ? 'px-3 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'px-3 py-1 rounded-lg text-xs font-bold text-rose-400 hover:bg-white/5';
      document.getElementById('btn-inst-tabby').className = platform === 'Tabby' ? 'px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'px-3 py-1 rounded-lg text-xs font-bold text-emerald-400 hover:bg-white/5';
      renderInstallments();
    }

    function submitAddInstallment() {
      const name = document.getElementById('instName').value.trim();
      const amount = parseFloat(document.getElementById('instAmount').value) || 0;
      const platform = document.getElementById('instPlatform').value;
      const start = document.getElementById('instStart').value.trim() || 'Oct-26';
      const remainingMonths = parseInt(document.getElementById('instRemaining').value) || 3;

      if (!name || amount <= 0) {
        showToast('يرجى إدخال اسم المتجر وقيمة القسط');
        return;
      }

      appData.installments.unshift({
        id: 'inst-' + Date.now(),
        name,
        amount,
        platform,
        start,
        end: 'Mar-27',
        remainingMonths,
        status: 'active'
      });

      document.getElementById('instName').value = '';
      document.getElementById('instAmount').value = '';
      closeModal('addInstallmentModal');
      saveState();
      renderAll();
      showToast('تمت إضافة القسط بنجاح!');
    }

    function toggleInstallment(id) {
      appData.installments = appData.installments.map(item => {
        if (item.id === id) {
          const next = item.status === 'completed' ? 'active' : 'completed';
          return { ...item, status: next };
        }
        return item;
      });
      saveState();
      renderAll();
      showToast('تم تحديث حالة القسط');
    }

    function deleteInstallment(id) {
      appData.installments = appData.installments.filter(i => i.id !== id);
      saveState();
      renderAll();
      showToast('تم حذف القسط');
    }

    // 4. SAVINGS ACTIONS
    function submitAddSavings() {
      const title = document.getElementById('savTitle').value.trim();
      const amount = parseFloat(document.getElementById('savAmount').value) || 0;
      const category = document.getElementById('savCategory').value;

      if (!title || amount <= 0) {
        showToast('يرجى إدخال اسم بند الادخار والمبلغ');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      appData.savings.unshift({
        id: 'sav-' + Date.now(),
        title,
        amount,
        category,
        date: today
      });

      document.getElementById('savTitle').value = '';
      document.getElementById('savAmount').value = '';
      closeModal('addSavingsModal');
      saveState();
      renderAll();
      showToast('تم إيداع مبلغ الادخار بنجاح!');
    }

    function deleteSavings(id) {
      appData.savings = appData.savings.filter(s => s.id !== id);
      saveState();
      renderAll();
      showToast('تم حذف بند الادخار');
    }

    // 5. INCOMES & FIXED ACTIONS
    function submitAddIncome() {
      const title = document.getElementById('incTitle').value.trim();
      const amount = parseFloat(document.getElementById('incAmount').value) || 0;
      if (!title || amount <= 0) return showToast('يرجى إدخال بيانات صحيحة');

      appData.incomes.push({
        id: 'inc-' + Date.now(),
        title,
        amount,
        frequency: 'monthly',
        category: 'إضافي',
        isRecurring: true
      });
      document.getElementById('incTitle').value = '';
      document.getElementById('incAmount').value = '';
      closeModal('addIncomeModal');
      saveState();
      renderAll();
      showToast('تمت إضافة الدخل بنجاح');
    }

    function deleteIncome(id) {
      if (appData.incomes.length <= 1) return showToast('يجب الإبقاء على بند دخل واحد على الأقل');
      appData.incomes = appData.incomes.filter(i => i.id !== id);
      saveState();
      renderAll();
      showToast('تم حذف الدخل');
    }

    function submitAddFixed() {
      const title = document.getElementById('fixTitle').value.trim();
      const amount = parseFloat(document.getElementById('fixAmount').value) || 0;
      if (!title || amount <= 0) return showToast('يرجى إدخال بيانات صحيحة');

      appData.fixedObligations.push({
        id: 'fix-' + Date.now(),
        title,
        amount,
        category: 'ثابت'
      });
      document.getElementById('fixTitle').value = '';
      document.getElementById('fixAmount').value = '';
      closeModal('addFixedModal');
      saveState();
      renderAll();
      showToast('تمت إضافة الالتزام الثابت');
    }

    function deleteFixed(id) {
      appData.fixedObligations = appData.fixedObligations.filter(f => f.id !== id);
      saveState();
      renderAll();
      showToast('تم حذف الالتزام');
    }

    // 6. RECEIVABLES & LIABILITIES
    let targetReceivable = null;
    function promptRouteReceivable(id) {
      const item = appData.receivables.find(r => r.id === id);
      if (!item) return;
      targetReceivable = item;
      document.getElementById('routeDetailsText').innerText = formatNumber(item.amount) + ' ر.س من ' + item.name;
      openModal('routeReceivableModal');
    }

    function confirmRoute(destination) {
      if (!targetReceivable) return;
      const amount = targetReceivable.amount;
      const name = targetReceivable.name;
      const today = new Date().toISOString().split('T')[0];

      // Mark receivable as collected
      appData.receivables = appData.receivables.map(r => r.id === targetReceivable.id ? { ...r, status: 'تم التحصيل' } : r);

      if (destination === 'bnpl_payoff') {
        const active = appData.installments.find(i => i.status === 'active');
        if (active) active.status = 'completed';
        showToast('تم توجيه ' + formatNumber(amount) + ' ر.س لسداد أقساط تمارا/تابي!');
      } else if (destination === 'savings') {
        appData.savings.unshift({
          id: 'sav-' + Date.now(),
          title: 'تحصيل مستحق من ' + name,
          amount: amount,
          category: 'مخصص الدفعة الأخيرة للسيارة',
          date: today
        });
        showToast('تم إيداع ' + formatNumber(amount) + ' ر.س في مخصص دفعة السيارة (37k)!');
      } else if (destination === 'income') {
        appData.incomes.push({
          id: 'inc-' + Date.now(),
          title: 'تحصيل دين من ' + name,
          amount: amount,
          frequency: 'monthly',
          category: 'تحصيل مستحق',
          isRecurring: false
        });
        showToast('تمت إضافة ' + formatNumber(amount) + ' ر.س إلى إيرادات هذا الشهر!');
      }

      closeModal('routeReceivableModal');
      saveState();
      renderAll();
    }

    function deleteReceivable(id) {
      appData.receivables = appData.receivables.filter(r => r.id !== id);
      saveState();
      renderAll();
      showToast('تم حذف القيد');
    }

    function submitAddReceivable() {
      const name = document.getElementById('recName').value.trim();
      const amount = parseFloat(document.getElementById('recAmount').value) || 0;
      if (!name || amount <= 0) return showToast('يرجى إدخال اسم ومبلغ صحيح');

      appData.receivables.unshift({
        id: 'rec-' + Date.now(),
        name,
        amount,
        status: 'معلق',
        date: new Date().toISOString().split('T')[0]
      });
      document.getElementById('recName').value = '';
      document.getElementById('recAmount').value = '';
      closeModal('addReceivableModal');
      saveState();
      renderAll();
      showToast('تم تسجيل المستحق المعلق');
    }

    function submitAddLiability() {
      const title = document.getElementById('liabTitle').value.trim();
      const amount = parseFloat(document.getElementById('liabAmount').value) || 0;
      const dueDate = document.getElementById('liabDueDate').value.trim() || '2028-08-01';
      if (!title || amount <= 0) return showToast('يرجى إدخال عنوان ومبلغ صحيح');

      appData.liabilities.push({
        id: 'liab-' + Date.now(),
        title,
        amount,
        dueDate,
        category: 'التزام مؤجل',
        status: 'مستحق'
      });
      document.getElementById('liabTitle').value = '';
      document.getElementById('liabAmount').value = '';
      closeModal('addLiabilityModal');
      saveState();
      renderAll();
      showToast('تم تسجيل الالتزام المؤجل');
    }

    function deleteLiability(id) {
      appData.liabilities = appData.liabilities.filter(l => l.id !== id);
      saveState();
      renderAll();
      showToast('تم حذف الدين');
    }

    // BACKUP IMPORT / EXPORT
    function exportData() {
      const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'financial_hub_data_backup.json';
      a.click();
    }

    function importData(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.incomes) appData = parsed;
          saveState();
          renderAll();
          showToast('تم استيراد النسخة الاحتياطية بنجاح!');
        } catch(err) {
          showToast('ملف غير صالح');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }

    function resetData() {
      appData = JSON.parse(JSON.stringify(INITIAL_DATA));
      saveState();
      renderAll();
      showToast('تمت استعادة البيانات الأصلية');
    }

    // ==========================================
    // RENDER FUNCTIONS
    // ==========================================
    function renderDashboard() {
      const car = appData.carPlan;
      const carPct = Math.round((car.paidInstallments / car.totalInstallments) * 100);
      const carRemaining = car.totalInstallments - car.paidInstallments;

      document.getElementById('carInstallmentVal').innerText = formatNumber(car.monthlyInstallment);
      document.getElementById('carPaidDisplay').innerText = car.paidInstallments;
      document.getElementById('carPctDisplay').innerText = carPct + '%';
      document.getElementById('carRemainingDisplay').innerText = carRemaining + ' شهراً';
      document.getElementById('carProgressBar').style.width = Math.min(carPct, 100) + '%';

      const totalIncome = appData.incomes.reduce((a, b) => a + b.amount, 0);
      const totalFixed = appData.fixedObligations.reduce((a, b) => a + b.amount, 0);
      const totalBNPL = appData.installments.filter(i => i.status === 'active').reduce((a, b) => a + b.amount, 0);
      const discretionaryNet = totalIncome - totalFixed - totalBNPL;
      const totalPersonalExpenses = appData.expenses.reduce((a, b) => a + b.amount, 0);
      const totalSavings = appData.savings.reduce((a, b) => a + b.amount, 0);
      const endingBalance = discretionaryNet - totalPersonalExpenses - totalSavings;

      document.getElementById('freedomSavingsDisplay').innerText = '+' + formatNumber(totalBNPL) + ' ر.س / شهرياً';

      // 4 Semantic KPI Cards
      document.getElementById('kpiGrid').innerHTML = \`
        <div class="glass-panel p-5 flex flex-col justify-between border-emerald-500/30">
          <div class="flex justify-between items-center">
            <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase">1. إجمالي الدخل</span>
            <div class="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xs">
              <i class="fa-solid fa-money-bill-wave"></i>
            </div>
          </div>
          <div class="mt-2 text-2xl font-bold font-mono text-emerald-400 num-ltr">
            \${formatNumber(totalIncome)} <small class="text-xs text-white/50">ر.س</small>
          </div>
          <div class="mt-2 pt-2 border-t border-white/10 flex justify-between text-[11px] text-white/60">
            <span>الراتب المعتمد</span>
            <span class="text-emerald-400 font-semibold">مستقر ومؤكد</span>
          </div>
        </div>

        <div class="glass-panel p-5 flex flex-col justify-between border-blue-500/30">
          <div class="flex justify-between items-center">
            <span class="text-[10px] font-mono font-bold text-blue-400 uppercase">2. الالتزامات الشهرية</span>
            <div class="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs">
              <i class="fa-solid fa-car"></i>
            </div>
          </div>
          <div class="mt-2 text-2xl font-bold font-mono text-blue-400 num-ltr">
            \${formatNumber(totalFixed)} <small class="text-xs text-white/50">ر.س</small>
          </div>
          <div class="mt-2 pt-2 border-t border-white/10 flex justify-between text-[11px] text-white/60">
            <span>سيارة + سكن + بنزين</span>
            <span class="text-blue-300 font-mono">\${appData.fixedObligations.length} بنود</span>
          </div>
        </div>

        <div class="glass-panel p-5 flex flex-col justify-between border-rose-500/35">
          <div class="flex justify-between items-center">
            <span class="text-[10px] font-mono font-bold text-rose-400 uppercase">3. أقساط تمارا وتابي</span>
            <div class="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center text-xs">
              <i class="fa-solid fa-layer-group"></i>
            </div>
          </div>
          <div class="mt-2 text-2xl font-bold font-mono text-rose-400 num-ltr">
            \${formatNumber(totalBNPL)} <small class="text-xs text-white/50">ر.س</small>
          </div>
          <div class="mt-2 pt-2 border-t border-white/10 flex justify-between text-[11px] text-rose-400">
            <span>ذروة الدفع الآجل</span>
            <span class="font-semibold">تنتهي Mar-27</span>
          </div>
        </div>

        <div class="glass-panel p-5 flex flex-col justify-between \${discretionaryNet >= 0 ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/50 bg-rose-500/5'}">
          <div class="flex justify-between items-center">
            <span class="text-[10px] font-mono font-bold \${discretionaryNet >= 0 ? 'text-emerald-400' : 'text-rose-400'} uppercase">4. الصافي الحر المتاح</span>
            <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs \${discretionaryNet >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}">
              <i class="fa-solid fa-wallet"></i>
            </div>
          </div>
          <div class="mt-2 text-2xl font-bold font-mono num-ltr \${discretionaryNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
            \${discretionaryNet >= 0 ? '+' : ''}\${formatNumber(discretionaryNet)} <small class="text-xs text-white/50">ر.س</small>
          </div>
          <div class="mt-2 pt-2 border-t border-white/10 flex justify-between text-[11px]">
            <span class="text-white/60">المتبقي للمصروف والادخار</span>
            <span class="\${discretionaryNet >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}">\${discretionaryNet >= 0 ? 'فائض متاح' : 'عجز مؤقت بالذروة'}</span>
          </div>
        </div>
      \`;

      // Cash Flow Equation Box
      document.getElementById('pipelineBox').innerHTML = \`
        <div class="flex justify-between items-center border-b border-white/10 pb-2">
          <span class="font-bold text-xs text-white">معادلة التدفق المالي الذكية: [الدخل] - [الثوابت] - [تمارا وتابي] = الصافي المتاح</span>
          <span class="text-[10px] font-mono text-emerald-400">CASH FLOW FORMULA</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-xs">
          <div class="bg-black/30 p-2.5 rounded-xl border border-emerald-500/30">
            <span class="text-[10px] text-emerald-400 font-bold block">1. إجمالي الدخل</span>
            <p class="text-base font-bold font-mono text-emerald-400 num-ltr mt-0.5">\${formatNumber(totalIncome)}</p>
          </div>
          <div class="bg-black/30 p-2.5 rounded-xl border border-blue-500/30">
            <span class="text-[10px] text-blue-400 font-bold block">2. الثوابت (-)</span>
            <p class="text-base font-bold font-mono text-blue-400 num-ltr mt-0.5">\${formatNumber(totalFixed)}</p>
          </div>
          <div class="bg-black/30 p-2.5 rounded-xl border border-rose-500/30">
            <span class="text-[10px] text-rose-400 font-bold block">3. تمارا وتابي (-)</span>
            <p class="text-base font-bold font-mono text-rose-400 num-ltr mt-0.5">\${formatNumber(totalBNPL)}</p>
          </div>
          <div class="bg-black/30 p-2.5 rounded-xl border border-indigo-500/30">
            <span class="text-[10px] text-indigo-400 font-bold block">4. الصافي المتاح</span>
            <p class="text-base font-bold font-mono text-indigo-400 num-ltr mt-0.5">\${formatNumber(discretionaryNet)}</p>
          </div>
          <div class="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/50">
            <span class="text-[10px] text-emerald-300 font-bold block">5. الفائض الفعلي</span>
            <p class="text-base font-bold font-mono text-emerald-300 num-ltr mt-0.5">\${formatNumber(endingBalance)}</p>
          </div>
        </div>
      \`;

      // Render Chart
      renderChartSvg();

      // Render Monthly Table
      renderMonthlyTable();
    }

    function renderChartSvg() {
      const container = document.getElementById('chartContainer');
      const data = appData.monthlyData.slice(0, 10);
      const width = 720;
      const height = 220;
      const padX = 40;
      const padY = 30;

      const commitments = data.map(m => m.car + m.home + m.gas + m.tamara + m.tabby);
      const nets = data.map(m => m.salary - (m.car + m.home + m.gas + m.tamara + m.tabby));

      const minVal = Math.min(...nets, 0) - 400;
      const maxVal = Math.max(...commitments, 6500) + 400;
      const range = maxVal - minVal;

      const getX = (idx) => padX + (idx / (data.length - 1)) * (width - padX * 2);
      const getY = (val) => padY + (height - padY * 2) - ((val - minVal) / range) * (height - padY * 2);

      let commitPath = '';
      let netPath = '';

      commitments.forEach((val, i) => {
        const x = getX(i);
        const y = getY(val);
        commitPath += (i === 0 ? 'M ' : ' L ') + x + ',' + y;
      });

      nets.forEach((val, i) => {
        const x = getX(i);
        const y = getY(val);
        netPath += (i === 0 ? 'M ' : ' L ') + x + ',' + y;
      });

      const zeroY = getY(0);

      let pointsSvg = '';
      data.forEach((m, i) => {
        const x = getX(i);
        const cy = getY(commitments[i]);
        const ny = getY(nets[i]);
        pointsSvg += \`
          <circle cx="\${x}" cy="\${cy}" r="4" fill="#f43f5e" stroke="#09090b" stroke-width="2"/>
          <circle cx="\${x}" cy="\${ny}" r="4" fill="#10b981" stroke="#09090b" stroke-width="2"/>
          <text x="\${x}" y="\${height - 8}" fill="rgba(255,255,255,0.6)" font-size="9" text-anchor="middle" font-family="'Geist Mono', monospace">\${m.month}</text>
        \`;
      });

      container.innerHTML = \`
        <svg viewBox="0 0 \${width} \${height}" class="w-full h-48 select-none">
          <line x1="\${padX}" y1="\${zeroY}" x2="\${width - padX}" y2="\${zeroY}" stroke="rgba(255,255,255,0.15)" stroke-dasharray="3,3"/>
          <path d="\${commitPath}" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round"/>
          <path d="\${netPath}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>
          \${pointsSvg}
        </svg>
        <div class="flex justify-center gap-6 text-[11px] pt-1 border-t border-white/5">
          <span class="flex items-center gap-1.5 text-rose-400 font-semibold"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> مسار انخفاض الأقساط والالتزامات (أحمر)</span>
          <span class="flex items-center gap-1.5 text-emerald-400 font-semibold"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> مسار نمو الصافي المتاح (أخضر)</span>
        </div>
      \`;
    }

    function renderMonthlyTable() {
      const tbody = document.getElementById('monthlyTableBody');
      tbody.innerHTML = '';
      appData.monthlyData.forEach(row => {
        const totalCommit = row.car + row.home + row.gas + row.tamara + row.tabby;
        const net = row.salary - totalCommit;
        const isFree = row.tamara === 0 && row.tabby === 0;

        const tr = document.createElement('tr');
        tr.className = isFree ? 'bg-emerald-500/10 hover:bg-emerald-500/15' : 'hover:bg-white/5';
        tr.innerHTML = \`
          <td class="p-3 font-bold font-mono num-ltr \${isFree ? 'text-emerald-400' : 'text-white'}">\${row.month} \${isFree ? '✨' : ''}</td>
          <td class="p-3 text-center font-mono num-ltr">\${formatNumber(row.salary)}</td>
          <td class="p-3 text-center font-mono num-ltr text-blue-400">\${formatNumber(row.car)}</td>
          <td class="p-3 text-center font-mono num-ltr text-white/60">\${formatNumber(row.home)}</td>
          <td class="p-3 text-center font-mono num-ltr text-white/60">\${formatNumber(row.gas)}</td>
          <td class="p-3 text-center font-mono num-ltr text-rose-400">\${row.tamara > 0 ? formatNumber(row.tamara) : '0.00'}</td>
          <td class="p-3 text-center font-mono num-ltr text-emerald-400">\${row.tabby > 0 ? formatNumber(row.tabby) : '0.00'}</td>
          <td class="p-3 text-center font-bold font-mono num-ltr text-rose-300">\${formatNumber(totalCommit)}</td>
          <td class="p-3 text-center font-bold font-mono num-ltr \${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}">\${net >= 0 ? '+' : ''}\${formatNumber(net)}</td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function renderIncomeFixed() {
      const container = document.getElementById('incomeFixedContainer');
      let incHtml = \`
        <div class="glass-panel p-5 space-y-3">
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <h3 class="font-bold text-sm text-white">مصادر الدخل</h3>
            <span class="text-xs font-mono font-bold text-emerald-400">\${formatNumber(appData.incomes.reduce((a,b)=>a+b.amount,0))} ر.س</span>
          </div>
          <div class="divide-y divide-white/5 text-xs">
      \`;
      appData.incomes.forEach(i => {
        incHtml += \`
          <div class="py-2.5 flex justify-between items-center">
            <div>
              <span class="font-bold text-white">\${i.title}</span>
              <span class="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded mr-2">\${i.category}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-emerald-400 num-ltr">\${formatNumber(i.amount)} ر.س</span>
              <button onclick="deleteIncome('\${i.id}')" class="text-white/40 hover:text-rose-400 p-1"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        \`;
      });
      incHtml += \`</div></div>\`;

      let fixHtml = \`
        <div class="glass-panel p-5 space-y-3">
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <h3 class="font-bold text-sm text-white">الالتزامات الثابتة (سيارة + سكن + بنزين)</h3>
            <span class="text-xs font-mono font-bold text-blue-400">\${formatNumber(appData.fixedObligations.reduce((a,b)=>a+b.amount,0))} ر.س</span>
          </div>
          <div class="divide-y divide-white/5 text-xs">
      \`;
      appData.fixedObligations.forEach(f => {
        fixHtml += \`
          <div class="py-2.5 flex justify-between items-center">
            <div>
              <span class="font-bold text-white">\${f.title}</span>
              <span class="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded mr-2">\${f.category}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-blue-400 num-ltr">\${formatNumber(f.amount)} ر.س</span>
              <button onclick="deleteFixed('\${f.id}')" class="text-white/40 hover:text-rose-400 p-1"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        \`;
      });
      fixHtml += \`</div></div>\`;

      container.innerHTML = incHtml + fixHtml;
    }

    function renderInstallments() {
      const grid = document.getElementById('installmentsGrid');
      grid.innerHTML = '';

      const filtered = appData.installments.filter(i => activeInstFilter === 'all' || i.platform === activeInstFilter);
      const totalActive = appData.installments.filter(i => i.status === 'active').reduce((a, b) => a + b.amount, 0);
      document.getElementById('totalActiveInstDisplay').innerText = formatNumber(totalActive);

      filtered.forEach(item => {
        const isTamara = item.platform === 'Tamara';
        const isDone = item.status === 'completed';

        const card = document.createElement('div');
        card.className = "glass-panel p-4.5 flex flex-col justify-between " + (isDone ? 'opacity-40 border-white/5' : isTamara ? 'border-rose-500/30' : 'border-emerald-500/30');
        card.innerHTML = \`
          <div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded \${isTamara ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}">
                \${item.platform}
              </span>
              <div class="flex items-center gap-1.5">
                <button onclick="toggleInstallment('\${item.id}')" class="text-xs px-2 py-0.5 rounded border border-white/15 hover:bg-white/10 \${isDone ? 'text-emerald-400 font-bold' : 'text-white/60'}">
                  \${isDone ? 'مكتمل' : 'سداد مبكر'}
                </button>
                <button onclick="deleteInstallment('\${item.id}')" class="text-xs text-white/40 hover:text-rose-400 p-1"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
            <h4 class="font-bold text-sm text-white \${isDone ? 'line-through text-white/40' : ''}">\${item.name}</h4>
            <p class="text-[11px] text-white/50 mt-0.5">من \${item.start} إلى \${item.end}</p>
          </div>
          <div class="pt-3 border-t border-white/10 flex justify-between items-end mt-3">
            <div>
              <span class="text-[10px] font-mono text-white/50 block">القسط الشهري</span>
              <span class="text-base font-bold font-mono text-white num-ltr">\${formatNumber(item.amount)} <small class="text-[10px] text-white/50">ر.س</small></span>
            </div>
            <span class="text-xs font-mono num-ltr \${isDone ? 'text-emerald-400' : 'text-amber-400 font-bold'}">
              \${isDone ? 'تم السداد' : item.remainingMonths + ' أشهر متبقية'}
            </span>
          </div>
        \`;
        grid.appendChild(card);
      });
    }

    function renderExpenses() {
      const tbody = document.getElementById('expensesTableBody');
      tbody.innerHTML = '';
      const query = (document.getElementById('expenseSearch')?.value || '').toLowerCase();

      const filtered = appData.expenses.filter(e => e.desc.toLowerCase().includes(query) || e.category.toLowerCase().includes(query));
      const total = filtered.reduce((a, b) => a + b.amount, 0);
      document.getElementById('expensesTotalBadge').innerText = formatNumber(total) + ' ر.س';

      filtered.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5";
        tr.innerHTML = \`
          <td class="p-3 font-semibold text-white">\${item.desc}</td>
          <td class="p-3 text-center text-xs text-white/70"><span class="bg-white/5 px-2 py-0.5 rounded border border-white/10">\${item.category}</span></td>
          <td class="p-3 text-center text-xs text-white/60">\${item.method}</td>
          <td class="p-3 text-center font-bold font-mono text-rose-400 num-ltr">\${formatNumber(item.amount)} ر.س</td>
          <td class="p-3 text-center text-xs text-white/50 font-mono num-ltr">\${item.date}</td>
          <td class="p-3 text-center">
            <button onclick="deleteExpense('\${item.id}')" class="text-white/40 hover:text-rose-400 transition"><i class="fa-solid fa-trash text-xs"></i></button>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function renderSavings() {
      const bucketsContainer = document.getElementById('savingsBuckets');
      const totalSaved = appData.savings.reduce((a, b) => a + b.amount, 0);
      const carBalloonSaved = appData.savings.filter(s => s.category === 'مخصص الدفعة الأخيرة للسيارة').reduce((a, b) => a + b.amount, 0);
      const emergencySaved = appData.savings.filter(s => s.category === 'صندوق طوارئ').reduce((a, b) => a + b.amount, 0);
      const carTargetPct = Math.round((carBalloonSaved / 37000) * 100);

      document.getElementById('savingsCountDisplay').innerText = appData.savings.length + ' RECORDS';

      bucketsContainer.innerHTML = \`
        <div class="glass-panel p-4.5 border-purple-500/30 flex flex-col justify-between">
          <div class="flex justify-between items-center">
            <span class="text-xs font-mono text-purple-400 font-bold uppercase">مخصص دفعة السيارة (37k)</span>
            <span class="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded font-bold">\${carTargetPct}% TARGET</span>
          </div>
          <p class="text-xl font-bold font-mono text-purple-400 num-ltr mt-1">
            \${formatNumber(carBalloonSaved)} <small class="text-xs text-white/50">/ 37,000 ر.س</small>
          </p>
          <div class="w-full bg-white/10 rounded-full h-2 mt-2.5 overflow-hidden">
            <div class="bg-gradient-to-r from-purple-500 to-emerald-400 h-full rounded-full" style="width: \${Math.min(carTargetPct, 100)}%;"></div>
          </div>
        </div>

        <div class="glass-panel p-4.5 border-emerald-500/30 flex items-center justify-between">
          <div>
            <span class="text-xs font-mono text-emerald-400 font-bold uppercase">إجمالي المدخرات المحققة</span>
            <p class="text-xl font-bold font-mono text-emerald-400 num-ltr mt-1">
              \${formatNumber(totalSaved)} <small class="text-xs text-white/50">ر.س</small>
            </p>
          </div>
          <div class="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <i class="fa-solid fa-piggy-bank"></i>
          </div>
        </div>

        <div class="glass-panel p-4.5 border-blue-500/30 flex items-center justify-between">
          <div>
            <span class="text-xs font-mono text-blue-400 font-bold uppercase">صندوق الطوارئ المحمي</span>
            <p class="text-xl font-bold font-mono text-blue-400 num-ltr mt-1">
              \${formatNumber(emergencySaved)} <small class="text-xs text-white/50">ر.س</small>
            </p>
          </div>
          <div class="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-400 flex items-center justify-center">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
        </div>
      \`;

      const tbody = document.getElementById('savingsTableBody');
      tbody.innerHTML = '';
      appData.savings.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5";
        tr.innerHTML = \`
          <td class="p-3 font-semibold text-white">\${item.title}</td>
          <td class="p-3 text-center text-xs text-purple-300"><span class="bg-purple-500/15 px-2.5 py-0.5 rounded border border-purple-500/30">\${item.category}</span></td>
          <td class="p-3 text-center font-bold font-mono text-emerald-400 num-ltr">+\${formatNumber(item.amount)} ر.س</td>
          <td class="p-3 text-center text-xs text-white/50 font-mono num-ltr">\${item.date}</td>
          <td class="p-3 text-center">
            <button onclick="deleteSavings('\${item.id}')" class="text-white/40 hover:text-rose-400 transition"><i class="fa-solid fa-trash text-xs"></i></button>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function renderLiabilitiesReceivables() {
      const grid = document.getElementById('liabilitiesReceivablesGrid');
      const totalLiabilities = appData.liabilities.reduce((a, b) => a + b.amount, 0);
      const pendingReceivables = appData.receivables.filter(r => r.status === 'معلق');
      const totalPending = pendingReceivables.reduce((a, b) => a + b.amount, 0);

      let recHtml = \`
        <div class="glass-panel p-5 space-y-3.5 border-amber-500/30">
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <div>
              <h3 class="font-bold text-sm text-white">أموالك المعلقة لدى الغير (فلوس لك)</h3>
              <p class="text-[11px] text-white/60">whale, Abdullah, 3day وغيرهم</p>
            </div>
            <span class="text-xs font-mono font-bold text-amber-400">\${formatNumber(totalPending)} ر.س</span>
          </div>
          <div class="space-y-2 text-xs">
      \`;

      appData.receivables.forEach(item => {
        const isDone = item.status === 'تم التحصيل';
        recHtml += \`
          <div class="p-3 rounded-xl border border-white/10 bg-black/25 flex justify-between items-center \${isDone ? 'opacity-40' : ''}">
            <div>
              <span class="font-bold text-white block">\${item.name}</span>
              <span class="text-[10px] text-white/50 font-mono">\${item.status}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-amber-400 num-ltr">\${formatNumber(item.amount)} ر.س</span>
              \${!isDone ? \`
                <button onclick="promptRouteReceivable('\${item.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition">
                  <i class="fa-solid fa-check"></i> تم التحصيل
                </button>
              \` : '<span class="text-emerald-400 font-bold text-xs">محصل</span>'}
              <button onclick="deleteReceivable('\${item.id}')" class="text-white/40 hover:text-rose-400 p-1"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        \`;
      });
      recHtml += \`</div></div>\`;

      let liabHtml = \`
        <div class="glass-panel p-5 space-y-3.5 border-rose-500/30">
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <div>
              <h3 class="font-bold text-sm text-white">ديون والتزامات مؤجلة عليك</h3>
              <p class="text-[11px] text-white/60">الدفعة الأخيرة للسيارة (37k) والالتزامات المؤجلة</p>
            </div>
            <span class="text-xs font-mono font-bold text-rose-400">\${formatNumber(totalLiabilities)} ر.س</span>
          </div>
          <div class="space-y-2 text-xs">
      \`;

      appData.liabilities.forEach(l => {
        liabHtml += \`
          <div class="p-3 rounded-xl border border-white/10 bg-black/25 flex justify-between items-center">
            <div>
              <span class="font-bold text-white block">\${l.title}</span>
              <span class="text-[10px] text-white/50 font-mono">الاستحقاق: \${l.dueDate}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-rose-400 num-ltr">\${formatNumber(l.amount)} ر.س</span>
              <button onclick="deleteLiability('\${l.id}')" class="text-white/40 hover:text-rose-400 p-1"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        \`;
      });
      liabHtml += \`</div></div>\`;

      grid.innerHTML = recHtml + liabHtml;
    }

    function renderAll() {
      renderDashboard();
      renderIncomeFixed();
      renderInstallments();
      renderExpenses();
      renderSavings();
      renderLiabilitiesReceivables();
    }

    window.onload = () => {
      renderAll();
    };
  </script>
</body>
</html>`;
}
