import confetti from 'canvas-confetti';

export function toEnglishDigits(val: string | number): string {
  const str = String(val);
  const arabicIndic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (d) => String(arabicIndic.indexOf(d)));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount);
}

export function triggerCelebration() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  } catch (e) {
    // Ignore in unsupported environments
    console.error(e);
  }
}

