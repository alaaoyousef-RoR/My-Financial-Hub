import * as XLSX from 'xlsx';
import { ExpenseCategory } from '../types/finance';

export interface ParsedBankTransaction {
  id: string;
  rawDate: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  balance?: number;
  reference?: string;
  suggestedCategory: ExpenseCategory;
  selectedCategory: ExpenseCategory;
  selected: boolean;
}

export interface StatementSummary {
  totalCount: number;
  selectedCount: number;
  totalDebits: number;
  totalCredits: number;
  netCashFlow: number;
  startDate: string | null;
  endDate: string | null;
}

export interface ParseResult {
  success: boolean;
  transactions: ParsedBankTransaction[];
  summary: StatementSummary;
  error?: string;
  fileName?: string;
  detectedHeaders?: Record<string, string>;
}

// Comprehensive keyword categorization dictionary
const CATEGORY_RULES: { category: ExpenseCategory; keywords: string[] }[] = [
  {
    category: 'طعام ومقاهي',
    keywords: [
      'مطعم', 'كافيه', 'مقهى', 'قهوة', 'كوفي', 'شاورما', 'برجر', 'مخبز', 'حلويات',
      'تموينات', 'بقالة', 'دانكن', 'ستاربكس', 'ماكدونالدز', 'كنتاكي', 'هنقرستيشن',
      'جاهز', 'تويو', 'مرسول', 'شفز', 'بيك', 'albaik', 'starbucks', 'dunkin',
      'mcdonald', 'burger', 'kfc', 'hungerstation', 'jahez', 'toyou', 'mrsool',
      'cafe', 'coffee', 'bakery', 'restaurant', 'pastry', 'shawarma', 'pizza',
      'maestro', 'subway', 'barns', 'half million', 'crav', 'caribou', 'costa'
    ]
  },
  {
    category: 'تسوق وشخصي',
    keywords: [
      'سوق', 'مجمع', 'جرير', 'اكسترا', 'أمازون', 'نون', 'كارفور', 'بنده', 'العثيم',
      'لولو', 'الدانوب', 'التميمي', 'سيتي ماكس', 'سنتربوينت', 'زارا', 'اتش اند ام',
      'ردتاغ', 'شي ان', 'علي اكسبرس', 'amazon', 'noon', 'jarir', 'extra', 'carrefour',
      'panda', 'othaim', 'lulu', 'danube', 'tamimi', 'zara', 'h&m', 'centrepoint',
      'shein', 'aliexpress', 'max', 'namshi', 'ikea', 'shopping', 'supermarket',
      'hypermarket', 'mall', 'fashion', 'clothing', 'shoes', 'boutique', 'perfume'
    ]
  },
  {
    category: 'بنزين وسيارة',
    keywords: [
      'بنزين', 'محطة', 'وقود', 'الدريس', 'ساسكو', 'نفط', 'بترول', 'تسهيلات',
      'غسيل سيارات', 'مغسلة', 'زيت', 'كفرات', 'ورشة', 'صيانة سيارات', 'قطع غيار',
      'aldrees', 'sasco', 'naft', 'petrol', 'gasoline', 'fuel', 'petromin', 'بترومين',
      'oil change', 'car wash', 'tires', 'toyota', 'hyundai', 'ford', 'mechanic',
      'auto', 'parking', 'مواقف', 'موقف'
    ]
  },
  {
    category: 'فواتير وخدمات',
    keywords: [
      'فاتورة', 'سداد', 'الاتصالات', 'اس تي سي', 'موبايلي', 'زين', 'سلام', 'كهرباء',
      'مياه', 'بلدي', 'أبشر', 'ايجار', 'stc', 'mobily', 'zain', 'salam', 'seco',
      'sec', 'electricity', 'water', 'nwc', 'telecom', 'internet', 'bill', 'sadad',
      'netflix', 'spotify', 'apple.com', 'google', 'youtube', 'subscription', 'icloud'
    ]
  },
  {
    category: 'سكن ومستلزمات',
    keywords: [
      'ايجار', 'سكن', 'شقة', 'عمارة', 'عقار', 'ابيات', 'هوم سنتر', 'هوم بوكس',
      'ايكيا', 'ساكو', 'rent', 'housing', 'furniture', 'homebox', 'home centre',
      'saco', 'maintenance', 'سباكة', 'كهربائي', 'تكييف'
    ]
  },
  {
    category: 'صحة وعناية',
    keywords: [
      'صيدلية', 'النهدي', 'الدواء', 'مستشفى', 'مستوصف', 'عيادة', 'طبيب', 'اسنان',
      'نظارات', 'بصريات', 'مختبر', 'تحاليل', 'دواء', 'علاج', 'حلاقة', 'صالون',
      'سبا', 'pharmacy', 'nahdi', 'dawaa', 'hospital', 'clinic', 'medical', 'dental',
      'optics', 'lab', 'doctor', 'salon', 'barber', 'spa', 'fitness', 'gym', 'وقت اللياقة'
    ]
  },
  {
    category: 'ترفيه وخروجات',
    keywords: [
      'سينما', 'فوكس', 'موفي', 'تذكرة', 'ملاهي', 'بوليفارد', 'فعالية', 'مهرجان',
      'حفلة', 'شاليه', 'منتجع', 'استراحة', 'فندق', 'طيران', 'حجز', 'cinema',
      'vox', 'muvi', 'amc', 'ticket', 'boulevard', 'hotel', 'resort', 'flight',
      'booking', 'airbnb', 'entertainment', 'game', 'play'
    ]
  },
  {
    category: 'تغذية مخصص',
    keywords: [
      'راتب', 'مكافأة', 'حافز', 'أرباح', 'تحويل وارد', 'إيداع نقدي', 'إيداع صراف',
      'استرداد', 'كاش باك', 'salary', 'payroll', 'allowance', 'bonus', 'dividend',
      'inward transfer', 'cash deposit', 'atm deposit', 'refund', 'cashback', 'reversal'
    ]
  }
];

/**
 * Automatically classifies transaction description into an ExpenseCategory
 */
export function autoCategorize(description: string, type: 'DEBIT' | 'CREDIT'): ExpenseCategory {
  if (type === 'CREDIT') {
    return 'تغذية مخصص';
  }

  const cleanDesc = description.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (cleanDesc.includes(kw.toLowerCase())) {
        return rule.category;
      }
    }
  }

  return 'أخرى';
}

/**
 * Normalizes Excel dates, serials, and diverse string formats into YYYY-MM-DD
 */
export function normalizeDate(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];

  // If already a JavaScript Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  // If Excel numerical serial date (e.g. 45200)
  if (typeof val === 'number' && val > 20000 && val < 60000) {
    const utcDays = Math.floor(val - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    const y = dateInfo.getUTCFullYear();
    const m = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateInfo.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();

  // YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Attempt standard Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Cleans numerical currency string / number to a valid positive float
 */
export function cleanAmount(val: any): number {
  if (typeof val === 'number') return Math.abs(val);
  if (!val) return 0;
  
  // Remove currency words, commas, quotes, and non-numeric characters except '.' and '-'
  const cleaned = String(val)
    .replace(/[^\d.-]/g, '')
    .trim();

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

// Known bank header aliases
const HEADER_PATTERNS = {
  date: [
    'تاريخ العملية', 'التاريخ', 'تاريخ القيد', 'تاريخ المعاملة', 'تاريخ الحركة',
    'transaction date', 'trans date', 'date', 'value date', 'posting date', 'booking date', 'txn date'
  ],
  description: [
    'تفاصيل العملية', 'الوصف', 'البيان', 'تفاصيل الحركة', 'تفاصيل المعاملة', 'شرح القيد', 'الجهة', 'ملاحظات',
    'description', 'details', 'transaction details', 'narrative', 'particulars', 'remarks', 'merchant', 'trans details'
  ],
  debit: [
    'سحب', 'مدين', 'مبلغ السحب', 'المبلغ المدين', 'المصروف', 'المسحوبات',
    'debit', 'debit amount', 'withdrawal', 'dr', 'out', 'paid out', 'spent'
  ],
  credit: [
    'إيداع', 'دائن', 'مبلغ الإيداع', 'المبلغ الدائن', 'المقبوضات', 'الوارد',
    'credit', 'credit amount', 'deposit', 'cr', 'in', 'paid in', 'received'
  ],
  amount: [
    'المبلغ', 'قيمة العملية', 'مبلغ العملية', 'القيمة',
    'amount', 'transaction amount', 'txn amount', 'value'
  ],
  type: [
    'نوع العملية', 'النوع', 'طبيعة القيد',
    'type', 'transaction type', 'txn type', 'indicator', 'dr/cr', 'cr/dr'
  ],
  balance: [
    'الرصيد', 'الرصيد بعد العملية', 'الرصيد الحالي',
    'balance', 'running balance', 'closing balance', 'available balance'
  ],
  reference: [
    'المرجع', 'رقم المرجع', 'رقم العملية', 'رمز العملية',
    'reference', 'ref no', 'ref number', 'transaction id', 'txn id', 'sequence'
  ]
};

function matchHeaderType(cellText: string): string | null {
  const norm = cellText.toLowerCase().trim();
  if (!norm) return null;

  for (const [key, patterns] of Object.entries(HEADER_PATTERNS)) {
    for (const pat of patterns) {
      if (norm === pat || norm.includes(pat)) {
        return key;
      }
    }
  }
  return null;
}

/**
 * Core Parser Function: Reads raw file buffer using SheetJS, locates headers,
 * extracts records, and returns normalized transactions.
 */
export async function parseBankStatement(file: File): Promise<ParseResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: true,
      raw: false
    });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        transactions: [],
        summary: createEmptySummary(),
        error: 'الملف لا يحتوي على أي صفحات صالحة (Empty workbook).'
      };
    }

    // Inspect first active sheet
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

    // Convert sheet to 2D array of rows
    const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, {
      header: 1,
      defval: '',
      blankrows: false
    });

    if (!rawRows || rawRows.length < 2) {
      return {
        success: false,
        transactions: [],
        summary: createEmptySummary(),
        error: 'الملف فارغ أو لا يحتوي على صفوف بيانات كافية.'
      };
    }

    // Find the header row (search first 20 rows)
    let headerRowIndex = -1;
    let headerIndices: Record<string, number> = {};
    let detectedHeaders: Record<string, string> = {};

    for (let r = 0; r < Math.min(rawRows.length, 25); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;

      const matched: Record<string, number> = {};
      const detectedMap: Record<string, string> = {};

      row.forEach((cell, colIndex) => {
        const text = String(cell || '').trim();
        const matchedKey = matchHeaderType(text);
        if (matchedKey && matched[matchedKey] === undefined) {
          matched[matchedKey] = colIndex;
          detectedMap[matchedKey] = text;
        }
      });

      // Need at least date AND (debit or credit or amount or description)
      const hasDate = matched.date !== undefined;
      const hasAmountOrDebitCredit = 
        matched.debit !== undefined || 
        matched.credit !== undefined || 
        matched.amount !== undefined;

      if (hasDate && (hasAmountOrDebitCredit || matched.description !== undefined)) {
        headerRowIndex = r;
        headerIndices = matched;
        detectedHeaders = detectedMap;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return {
        success: false,
        transactions: [],
        summary: createEmptySummary(),
        error: 'تعذر التعرف التلقائي على أعمدة كشف الحساب. يرجى التأكد من وجود أعمدة التاريخ، الوصف، والمبلغ أو السحب/الإيداع.'
      };
    }

    const parsedItems: ParsedBankTransaction[] = [];

    // Parse data rows
    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.every(cell => !cell || String(cell).trim() === '')) {
        continue;
      }

      // Extract raw fields
      const rawDate = headerIndices.date !== undefined ? row[headerIndices.date] : '';
      const rawDesc = headerIndices.description !== undefined ? row[headerIndices.description] : '';
      const rawDebit = headerIndices.debit !== undefined ? row[headerIndices.debit] : '';
      const rawCredit = headerIndices.credit !== undefined ? row[headerIndices.credit] : '';
      const rawAmount = headerIndices.amount !== undefined ? row[headerIndices.amount] : '';
      const rawType = headerIndices.type !== undefined ? row[headerIndices.type] : '';
      const rawBalance = headerIndices.balance !== undefined ? row[headerIndices.balance] : '';
      const rawRef = headerIndices.reference !== undefined ? row[headerIndices.reference] : '';

      // Skip summary or footer rows
      const combinedRowText = row.map(c => String(c || '').toLowerCase()).join(' ');
      if (
        combinedRowText.includes('total') ||
        combinedRowText.includes('المجموع') ||
        combinedRowText.includes('إجمالي') ||
        combinedRowText.includes('closing balance') ||
        combinedRowText.includes('opening balance') ||
        combinedRowText.includes('الرصيد الافتتاحي')
      ) {
        continue;
      }

      const debitVal = cleanAmount(rawDebit);
      const creditVal = cleanAmount(rawCredit);
      const generalAmount = cleanAmount(rawAmount);

      let finalAmount = 0;
      let finalType: 'DEBIT' | 'CREDIT' = 'DEBIT';

      if (debitVal > 0) {
        finalAmount = debitVal;
        finalType = 'DEBIT';
      } else if (creditVal > 0) {
        finalAmount = creditVal;
        finalType = 'CREDIT';
      } else if (generalAmount > 0) {
        finalAmount = generalAmount;
        // Inspect rawType or sign
        const typeStr = String(rawType || '').toLowerCase();
        const amtStr = String(rawAmount || '').toLowerCase();

        if (
          typeStr.includes('cr') || 
          typeStr.includes('credit') || 
          typeStr.includes('إيداع') || 
          typeStr.includes('دائن') ||
          amtStr.startsWith('+')
        ) {
          finalType = 'CREDIT';
        } else {
          finalType = 'DEBIT';
        }
      }

      // Skip rows with 0 amount or no valid date
      if (finalAmount <= 0) continue;

      const normalizedDate = normalizeDate(rawDate);
      const description = String(rawDesc || '').trim() || (finalType === 'CREDIT' ? 'إيداع بنكي' : 'عملية مصرفية');
      const suggestedCategory = autoCategorize(description, finalType);

      parsedItems.push({
        id: `stmt-${Date.now()}-${r}-${Math.random().toString(36).substr(2, 6)}`,
        rawDate: String(rawDate),
        date: normalizedDate,
        description,
        amount: Math.round(finalAmount * 100) / 100,
        type: finalType,
        balance: rawBalance ? cleanAmount(rawBalance) : undefined,
        reference: rawRef ? String(rawRef).trim() : undefined,
        suggestedCategory,
        selectedCategory: suggestedCategory,
        selected: true
      });
    }

    if (parsedItems.length === 0) {
      return {
        success: false,
        transactions: [],
        summary: createEmptySummary(),
        error: 'لم يتم العثور على أي عمليات مالية قابلة للاستيراد في الملف.'
      };
    }

    const summary = computeStatementSummary(parsedItems);

    return {
      success: true,
      transactions: parsedItems,
      summary,
      fileName: file.name,
      detectedHeaders
    };

  } catch (err: any) {
    console.error('Error parsing bank statement file:', err);
    return {
      success: false,
      transactions: [],
      summary: createEmptySummary(),
      error: `حدث خطأ أثناء قراءة الملف: ${err.message || 'صيغة غير متوافقة'}`
    };
  }
}

/**
 * Calculates aggregates for parsed statement items
 */
export function computeStatementSummary(items: ParsedBankTransaction[]): StatementSummary {
  const selectedItems = items.filter(i => i.selected);

  let totalDebits = 0;
  let totalCredits = 0;

  const validDates = selectedItems
    .map(i => i.date)
    .filter(Boolean)
    .sort();

  selectedItems.forEach(item => {
    if (item.type === 'DEBIT') {
      totalDebits += item.amount;
    } else {
      totalCredits += item.amount;
    }
  });

  totalDebits = Math.round(totalDebits * 100) / 100;
  totalCredits = Math.round(totalCredits * 100) / 100;
  const netCashFlow = Math.round((totalCredits - totalDebits) * 100) / 100;

  return {
    totalCount: items.length,
    selectedCount: selectedItems.length,
    totalDebits,
    totalCredits,
    netCashFlow,
    startDate: validDates.length > 0 ? validDates[0] : null,
    endDate: validDates.length > 0 ? validDates[validDates.length - 1] : null
  };
}

function createEmptySummary(): StatementSummary {
  return {
    totalCount: 0,
    selectedCount: 0,
    totalDebits: 0,
    totalCredits: 0,
    netCashFlow: 0,
    startDate: null,
    endDate: null
  };
}
