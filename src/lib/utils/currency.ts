// File: ./src/lib/utils/currency.ts
// Currency formatting utilities for displaying amounts in the correct currency

// Currency code to symbol mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  // Major currencies
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  HKD: 'HK$',
  SGD: 'S$',
  // Middle East & Africa
  AED: 'د.إ',
  SAR: '﷼',
  ZAR: 'R',
  // Southeast Asia
  MYR: 'RM',
  THB: '฿',
  IDR: 'Rp',
  PHP: '₱',
  VND: '₫',
  // South Asia
  PKR: '₨',
  BDT: '৳',
  LKR: '₨',
  // Latin America
  BRL: 'R$',
  MXN: 'MX$',
  ARS: 'AR$',
  CLP: 'CLP$',
  COP: 'COL$',
  // Europe
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  RUB: '₽',
  TRY: '₺',
  // Others
  NZD: 'NZ$',
  KRW: '₩',
  TWD: 'NT$',
};

// Locale mapping for number formatting
const CURRENCY_LOCALES: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  // Add more as needed, defaults to 'en-US'
};

/**
 * Get the symbol for a currency code
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'INR')
 * @returns Currency symbol or the code itself if unknown
 */
export function getCurrencySymbol(currencyCode: string): string {
  const code = currencyCode?.toUpperCase() || 'INR';
  return CURRENCY_SYMBOLS[code] || code;
}

/**
 * Get the locale for formatting a currency
 * @param currencyCode - ISO 4217 currency code
 * @returns Locale string for number formatting
 */
export function getCurrencyLocale(currencyCode: string): string {
  const code = currencyCode?.toUpperCase() || 'INR';
  return CURRENCY_LOCALES[code] || 'en-US';
}

/**
 * Format a number as currency with the appropriate symbol and locale
 * @param amount - The amount to format
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'INR')
 * @returns Formatted currency string (e.g., '₹1,23,456' or '$123,456')
 */
export function formatCurrency(amount: number, currencyCode: string = 'INR'): string {
  const symbol = getCurrencySymbol(currencyCode);
  const locale = getCurrencyLocale(currencyCode);
  const formattedNumber = amount.toLocaleString(locale);
  return `${symbol}${formattedNumber}`;
}

/**
 * Format just the number portion without the symbol (for custom display)
 * @param amount - The amount to format
 * @param currencyCode - ISO 4217 currency code
 * @returns Formatted number string without symbol
 */
export function formatNumber(amount: number, currencyCode: string = 'INR'): string {
  const locale = getCurrencyLocale(currencyCode);
  return amount.toLocaleString(locale);
}
