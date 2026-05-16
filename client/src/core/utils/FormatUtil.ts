export class FormatUtil {
  static currency(value: number, decimals = 2): string {
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  static currencyWithSymbol(value: number, decimals = 2): string {
    return `₹${this.currency(value, decimals)}`;
  }

  static percentage(value: number, decimals = 2): string {
    return `${value.toFixed(decimals)}%`;
  }

  static pad(num: number, length = 2): string {
    return String(num).padStart(length, '0');
  }

  static capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static titleCase(str: string): string {
    if (!str) return '';
    return str
      .split(/[\s_-]+/)
      .map((word) => this.capitalize(word))
      .join(' ');
  }

  static truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  static employeeCode(code: string): string {
    return code.toUpperCase();
  }

  static phone(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  }
}

export default FormatUtil;