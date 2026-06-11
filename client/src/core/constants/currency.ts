export const CURRENCY_SYMBOL = '\u20B9';
export const CURRENCY_MAX_AMOUNT = 99999999;
export const CURRENCY_PRECISION = 2;

export function formatCurrency(value: number): string {
  return `${CURRENCY_SYMBOL}${value.toLocaleString()}`;
}
