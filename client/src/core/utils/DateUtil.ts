import dayjs from 'dayjs';

export class DateUtil {
  static format(date: string | Date | dayjs.Dayjs, format = 'DD/MM/YYYY'): string {
    return dayjs(date).format(format);
  }

  static formatMonth(date: string | Date | dayjs.Dayjs): string {
    return dayjs(date).format('MMMM YYYY');
  }

  static formatTime(date: string | Date | dayjs.Dayjs): string {
    return dayjs(date).format('HH:mm');
  }

  static parse(date: string): dayjs.Dayjs {
    return dayjs(date);
  }

  static now(): dayjs.Dayjs {
    return dayjs();
  }

  static getDaysInMonth(year: number, month: number): number {
    return dayjs(`${year}-${month}`).daysInMonth();
  }

  static getMonthStartEnd(year: number, month: number) {
    const start = dayjs(`${year}-${month}-01`);
    const end = start.endOf('month');
    return { start, end };
  }

  static addDays(date: string | Date | dayjs.Dayjs, days: number): dayjs.Dayjs {
    return dayjs(date).add(days, 'day');
  }

  static subtractDays(date: string | Date | dayjs.Dayjs, days: number): dayjs.Dayjs {
    return dayjs(date).subtract(days, 'day');
  }

  static isAfter(date1: string | Date, date2: string | Date): boolean {
    return dayjs(date1).isAfter(dayjs(date2));
  }

  static isBefore(date1: string | Date, date2: string | Date): boolean {
    return dayjs(date1).isBefore(dayjs(date2));
  }

  static diffInDays(date1: string | Date, date2: string | Date): number {
    return dayjs(date1).diff(dayjs(date2), 'day');
  }

  static toISO(date: string | Date | dayjs.Dayjs): string {
    return dayjs(date).toISOString();
  }

  static toDate(date: string | Date | dayjs.Dayjs): Date {
    return dayjs(date).toDate();
  }
}

export default DateUtil;