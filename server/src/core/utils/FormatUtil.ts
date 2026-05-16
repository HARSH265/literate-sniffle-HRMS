export class FormatUtil {
  static currency(value: number, decimals = 2): string {
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  static percentage(value: number, decimals = 2): string {
    return `${value.toFixed(decimals)}%`;
  }

  static padNumber(num: number, length = 2): string {
    return String(num).padStart(length, '0');
  }

  static capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const maskedLocal = local[0] + '*'.repeat(local.length - 2) + local[local.length - 1];
    return `${maskedLocal}@${domain}`;
  }
}

export default FormatUtil;