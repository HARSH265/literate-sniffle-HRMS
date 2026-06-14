const DEFAULT_CURRENCY_SYMBOL = '\u20B9';

let _currencySymbol: string = DEFAULT_CURRENCY_SYMBOL;

export function setCurrencySymbol(symbol: string) {
  _currencySymbol = symbol || DEFAULT_CURRENCY_SYMBOL;
}

export function getCurrencySymbol(): string {
  return _currencySymbol;
}

export const CURRENCY_MAX_AMOUNT = 99999999;
export const CURRENCY_PRECISION = 2;

export function formatCurrency(value: number): string {
  return `${_currencySymbol}${value.toLocaleString()}`;
}
