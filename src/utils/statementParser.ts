import * as XLSX from 'xlsx';
import { ExpenseCategory } from '../types/finance';

export type TransactionType = 'DEBIT' | 'CREDIT';

export interface ParsedBankTransaction {
  id: string;
  rawDate: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
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

// Category keyword matching dictionary
const CATEGORY_RULES: { category: ExpenseCategory; keywords: string[] }[] = [
  {
    category: 'طعام ومقاهي',
    keywords: [
      'مطعم', 'كافيه', 'مقهى', 'قهوة', 'كوفي', 'شاورما', 'برجر', 'مخبز', 'حلويات',
      'تموينات', 'بقالة', 'دانكن', 'ستاربكس', 'ماكدونالدز', 'كنتاكي', 'هنقرستيشن',
      'جاهز', 'تويو', 'مرسول', 'شفز', 'بيك', 'albaik', 'starbucks', 'dunkin',
      'mcdonald', 'burger', 'kfc', 'hungerstation', 'jahez', 'toyou', 'mrsool',
      'cafe', 'coffee', 'bakery', 'restaurant', 'pastry', 'shawarma', 'pizza',
      'maestro', 'subway', 'barns', 'half million', 'crav', 'caribou', 'costa',
      'meat', 'grill', 'kitchen', 'فلافل', 'عصير', 'شاي'
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
      'hypermarket', 'mall', 'fashion', 'clothing', 'shoes', 'boutique', 'perfume',
      'عطور', 'ملابس', 'أقمشة', 'ساعة', 'ذهب'
    ]
  },
  {
    category: 'بنزين وسيارة',
    keywords: [
      'بنزين', 'محطة', 'وقود', 'الدريس', 'ساسكو', 'نفط', 'بترول', 'تسهيلات',
      'غسيل سيارات', 'مغسلة', 'زيت', 'كفرات', 'ورشة', 'صيانة سيارات', 'قطع غيار',
      'aldrees', 'sasco', 'naft', 'petrol', 'gasoline', 'fuel', 'petromin', 'بترومين',
      'oil change', 'car wash', 'tires', 'toyota', 'hyundai', 'ford', 'mechanic',
      'auto', 'parking', 'مواقف', 'موقف', 'سيارات'
    ]
  },
  {
    category: 'فواتير وخدمات',
    keywords: [
      'فاتورة', 'سداد', 'الاتصالات', 'اس تي سي', 'موبايلي', 'زين', 'سلام', 'كهرباء',
      'مياه', 'بلدي', 'أبشر', 'stc', 'mobily', 'zain', 'salam', 'seco',
      'sec', 'electricity', 'water', 'nwc', 'telecom', 'internet', 'bill', 'sadad',
      'netflix', 'spotify', 'apple.com', 'google', 'youtube', 'subscription', 'icloud',
      'اشتراك', 'خدمات', 'وزارة'
    ]
  },
  {
    category: 'سكن ومستلزمات',
    keywords: [
      'ايجار', 'إيجار', 'سكن', 'شقة', 'عمارة', 'عقار', 'ابيات', 'هوم سنتر', 'هوم بوكس',
      'ايكيا', 'ساكو', 'rent', 'housing', 'furniture', 'homebox', 'home centre',
      'saco', 'maintenance', 'سباكة', 'كهربائي', 'تكييف', 'أثاث', 'مفروشات'
    ]
  },
  {
    category: 'صحة وعناية',
    keywords: [
      'صيدلية', 'النهدي', 'الدواء', 'مستشفى', 'مستوصف', 'عيادة', 'طبيب', 'اسنان',
      'نظارات', 'بصريات', 'مختبر', 'تحاليل', 'دواء', 'علاج', 'حلاقة', 'صالون',
      'سبا', 'pharmacy', 'nahdi', 'dawaa', 'hospital', 'clinic', 'medical', 'dental',
      'optics', 'lab', 'doctor', 'salon', 'barber', 'spa', 'fitness', 'gym', 'وقت اللياقة',
      'نادي', 'رياضة'
    ]
  },
  {
    category: 'ترفيه وخروجات',
    keywords: [
      'سينما', 'فوكس', 'موفي', 'تذكرة', 'ملاهي', 'بوليفارد', 'فعالية', 'مهرجان',
      'حفلة', 'شاليه', 'منتجع', 'استراحة', 'فندق', 'طيران', 'حجز', 'cinema',
      'vox', 'muvi', 'amc', 'ticket', 'boulevard', 'hotel', 'resort', 'flight',
      'booking', 'airbnb', 'entertainment', 'game', 'play', 'موسم الرياض', 'فعاليات'
    ]
  }
];

/**
 * Automatically classifies transaction description into an ExpenseCategory.
 * - CREDIT rows default to 'تغذية مخصص' (income/top-up).
 * - DEBIT rows match merchant keywords and fallback safely to 'أخرى' (NOT 'تغذية مخصص').
 */
export function autoCategorize(description: string, type: TransactionType): ExpenseCategory {
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
 * Strips Unicode directional formatting markers, tabs, and newlines.
 * Collapses whitespace for reliable header matching across all banks.
 */
export function normalizeHeaderText(text: unknown): string {
  if (text === null || text === undefined) return '';
  return String(text)
    // Strip invisible & directional Unicode markers (LTR/RTL marks, embeddings, overrides)
    .replace(/[\u200B-\u200F\uFEFF\u202A-\u202E\u2066-\u2069]/g, '')
    // Replace newlines, line breaks, and tabs with a standard space
    .replace(/[\r\n\t]+/g, ' ')
    // Remove parentheses, brackets, and commas
    .replace(/[()[\]{}،,]/g, ' ')
    // Collapse extra spaces
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Parses numeric cell values, gracefully handling negative signs (Alinma debit style),
 * currency codes, commas, and scientific notation. Returns null if invalid or zero.
 */
export function parseNumericAmount(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }

  const cleaned = String(val)
    .replace(/[\u200B-\u200F\uFEFF\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/[^0-9.-]/g, '')
    .trim();

  if (!cleaned || cleaned === '-' || cleaned === '.') return null;

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Convenience helper returning a positive absolute float
 */
export function cleanAmount(val: unknown): number {
  return Math.abs(parseNumericAmount(val) || 0);
}

/**
 * Normalizes Excel dates, numerical serial numbers, and ISO strings into YYYY-MM-DD
 */
export function normalizeDate(val: unknown): string {
  if (!val) return new Date().toISOString().split('T')[0];

  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  // Excel serial date representation
  if (typeof val === 'number' && val > 20000 && val < 65000) {
    const utcDays = Math.floor(val - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    const y = dateInfo.getUTCFullYear();
    const m = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateInfo.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(val)
    .replace(/[\u200B-\u200F\uFEFF\u202A-\u202E\u2066-\u2069]/g, '')
    .trim();

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

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

type HeaderType = 'date' | 'description' | 'debit' | 'credit' | 'amount' | 'type' | 'balance' | 'reference';

/**
 * Matches normalized cell header string to semantic column roles.
 * Handles multiline Arabic/English compound headers e.g. "سحب (مدين)\nDebit".
 */
function matchHeaderType(rawCellText: unknown): HeaderType | null {
  const norm = normalizeHeaderText(rawCellText);
  if (!norm) return null;

  // 1. Debit Column: matches 'debit', 'سحب', 'مدين', 'dr'
  if (norm.includes('debit') || norm.includes('سحب') || norm.includes('مدين') || norm === 'dr') {
    return 'debit';
  }

  // 2. Credit Column: matches 'credit', 'إيداع', 'ايداع', 'دائن', 'cr'
  if (norm.includes('credit') || norm.includes('إيداع') || norm.includes('ايداع') || norm.includes('دائن') || norm === 'cr') {
    return 'credit';
  }

  // 3. Date Column: matches 'date', 'تاريخ'
  if (norm.includes('date') || norm.includes('تاريخ')) {
    return 'date';
  }

  // 4. Description Column: matches 'description', 'details', 'narrative', 'particulars', 'remarks', 'merchant', 'تفاصيل', 'الوصف', 'البيان', 'شرح'
  if (
    norm.includes('description') ||
    norm.includes('details') ||
    norm.includes('narrative') ||
    norm.includes('particulars') ||
    norm.includes('remarks') ||
    norm.includes('merchant') ||
    norm.includes('تفاصيل') ||
    norm.includes('الوصف') ||
    norm.includes('البيان') ||
    norm.includes('شرح') ||
    norm.includes('الجهة')
  ) {
    return 'description';
  }

  // 5. Balance Column
  if (norm.includes('balance') || norm.includes('الرصيد')) {
    return 'balance';
  }

  // 6. Reference Column
  if (norm.includes('reference') || norm.includes('ref') || norm.includes('مرجع') || norm.includes('المرجع')) {
    return 'reference';
  }

  // 7. Single Combined Amount Column (only if not debit or credit)
  if (norm.includes('amount') || norm.includes('المبلغ') || norm.includes('قيمة')) {
    return 'amount';
  }

  // 8. Transaction Type Column
  if (norm.includes('type') || norm.includes('نوع') || norm.includes('طبيعة')) {
    return 'type';
  }

  return null;
}

/**
 * Robust Client-Side Bank Statement Ingestion Utility (SheetJS).
 * Parses Alinma, Al Rajhi, SNB, and Riyadh bank .xlsx / .csv statements.
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

    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

    // Read rows as 2D array of unknown cells
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
      blankrows: false
    });

    if (!rawRows || rawRows.length < 2) {
      return {
        success: false,
        transactions: [],
        summary: createEmptySummary(),
        error: 'الملف فارغ أو لا يحتوي على صفوف كافية.'
      };
    }

    // Locate header row across first 30 rows
    let headerRowIndex = -1;
    let headerIndices: Partial<Record<HeaderType, number>> = {};
    const detectedHeaders: Record<string, string> = {};

    for (let r = 0; r < Math.min(rawRows.length, 30); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;

      const matched: Partial<Record<HeaderType, number>> = {};
      const detectedMap: Record<string, string> = {};

      row.forEach((cell, colIndex) => {
        const text = String(cell ?? '');
        const matchedKey = matchHeaderType(text);
        if (matchedKey && matched[matchedKey] === undefined) {
          matched[matchedKey] = colIndex;
          detectedMap[matchedKey] = text;
        }
      });

      const hasDate = matched.date !== undefined;
      const hasDebit = matched.debit !== undefined;
      const hasCredit = matched.credit !== undefined;
      const hasAmount = matched.amount !== undefined;
      const hasDescription = matched.description !== undefined;

      // Valid header requires Date AND (Debit or Credit or Amount or Description)
      if (hasDate && (hasDebit || hasCredit || hasAmount || hasDescription)) {
        headerRowIndex = r;
        headerIndices = matched;
        Object.assign(detectedHeaders, detectedMap);
        break;
      }
    }

    if (headerRowIndex === -1) {
      return {
        success: false,
        transactions: [],
        summary: createEmptySummary(),
        error: 'تعذر التعرف التلقائي على أعمدة كشف الحساب. يرجى التأكد من احتواء الملف على أعمدة التاريخ، الوصف، والسحب/الإيداع.'
      };
    }

    const parsedItems: ParsedBankTransaction[] = [];

    // Parse data rows
    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
        continue;
      }

      // Check for footer / summary rows to skip
      const combinedRowText = row.map(c => normalizeHeaderText(c)).join(' ');
      if (
        combinedRowText.includes('total') ||
        combinedRowText.includes('المجموع') ||
        combinedRowText.includes('إجمالي') ||
        combinedRowText.includes('closing balance') ||
        combinedRowText.includes('opening balance') ||
        combinedRowText.includes('الرصيد الافتتاحي') ||
        combinedRowText.includes('الرصيد الختامي') ||
        combinedRowText.includes('هاتف الإنماء') ||
        combinedRowText.includes('alinma phone') ||
        combinedRowText.includes('customer service') ||
        combinedRowText.includes('disclaimer') ||
        combinedRowText.includes('هذا الكشف صادر')
      ) {
        continue;
      }

      // Extract raw cell values
      const rawDate = headerIndices.date !== undefined ? row[headerIndices.date] : null;
      const rawDesc = headerIndices.description !== undefined ? row[headerIndices.description] : null;
      const rawDebit = headerIndices.debit !== undefined ? row[headerIndices.debit] : null;
      const rawCredit = headerIndices.credit !== undefined ? row[headerIndices.credit] : null;
      const rawAmount = headerIndices.amount !== undefined ? row[headerIndices.amount] : null;
      const rawType = headerIndices.type !== undefined ? row[headerIndices.type] : null;
      const rawBalance = headerIndices.balance !== undefined ? row[headerIndices.balance] : null;
      const rawRef = headerIndices.reference !== undefined ? row[headerIndices.reference] : null;

      const numDebit = parseNumericAmount(rawDebit);
      const numCredit = parseNumericAmount(rawCredit);
      const numAmount = parseNumericAmount(rawAmount);

      let finalAmount = 0;
      let finalType: TransactionType = 'DEBIT';

      // 1. Separate Debit & Credit columns
      if (numDebit !== null && Math.abs(numDebit) > 0.0001) {
        // In Alinma statements, debits are stored with negative sign (e.g. -136.00). Use Math.abs.
        finalAmount = Math.abs(numDebit);
        finalType = 'DEBIT';
      } else if (numCredit !== null && Math.abs(numCredit) > 0.0001) {
        finalAmount = Math.abs(numCredit);
        finalType = 'CREDIT';
      } else if (numAmount !== null && Math.abs(numAmount) > 0.0001) {
        // Single Amount column with sign or type indicator
        finalAmount = Math.abs(numAmount);
        const typeStr = normalizeHeaderText(rawType);
        const amtStr = String(rawAmount || '').trim();

        if (
          typeStr.includes('cr') ||
          typeStr.includes('credit') ||
          typeStr.includes('إيداع') ||
          typeStr.includes('ايداع') ||
          typeStr.includes('دائن') ||
          amtStr.startsWith('+')
        ) {
          finalType = 'CREDIT';
        } else if (numAmount < 0 || amtStr.startsWith('-') || typeStr.includes('dr') || typeStr.includes('debit') || typeStr.includes('سحب')) {
          finalType = 'DEBIT';
        } else {
          finalType = 'DEBIT';
        }
      }

      // Skip rows with zero or unresolvable amount
      if (finalAmount <= 0) continue;

      const normalizedDate = normalizeDate(rawDate);
      const description = String(rawDesc ?? '').trim() || (finalType === 'CREDIT' ? 'إيداع بنكي' : 'عملية سحب / شراء');
      const suggestedCategory = autoCategorize(description, finalType);

      const parsedBalance = parseNumericAmount(rawBalance);

      parsedItems.push({
        id: `stmt-${Date.now()}-${r}-${Math.random().toString(36).substr(2, 6)}`,
        rawDate: String(rawDate ?? ''),
        date: normalizedDate,
        description,
        amount: Math.round(finalAmount * 100) / 100,
        type: finalType,
        balance: parsedBalance !== null ? Math.round(parsedBalance * 100) / 100 : undefined,
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
        error: 'لم يتم العثور على أي عمليات مالية صالحة في الملف.'
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

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'صيغة غير متوافقة';
    console.error('Error parsing bank statement file:', err);
    return {
      success: false,
      transactions: [],
      summary: createEmptySummary(),
      error: `حدث خطأ أثناء قراءة الملف: ${errorMsg}`
    };
  }
}

/**
 * Calculates aggregates for parsed statement items based on active selection.
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
