import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';

dayjs.extend(utc);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export class DateUtil {
  static getWorkingDaysInMonth(year: number, month: number): number {
    const daysInMonth = dayjs(`${year}-${month}`).daysInMonth();
    return daysInMonth;
  }

  static getMonthRange(year: number, month: number) {
    const start = dayjs(`${year}-${month}-01`);
    const end = start.endOf('month');
    return { start, end };
  }

  static isHoliday(date: dayjs.Dayjs, holidays: string[]): boolean {
    const dateStr = date.format('YYYY-MM-DD');
    return holidays.includes(dateStr);
  }

  static isWeeklyOff(date: dayjs.Dayjs, offDays: number[]): boolean {
    return offDays.includes(date.day());
  }

  static formatDate(date: dayjs.Dayjs, format = 'DD/MM/YYYY'): string {
    return date.format(format);
  }

  static getDayOfWeek(date: dayjs.Dayjs): number {
    return date.day();
  }

  static calculateOvertimeHours(
    totalHours: number,
    standardHoursPerDay: number,
  ): number {
    return Math.max(0, totalHours - standardHoursPerDay);
  }

  static parseDate(date: string): dayjs.Dayjs {
    return dayjs(date);
  }

  static now(): dayjs.Dayjs {
    return dayjs();
  }

  static isSameOrBefore(date1: dayjs.Dayjs, date2: dayjs.Dayjs): boolean {
    return date1.isSameOrBefore(date2);
  }

  static isSameOrAfter(date1: dayjs.Dayjs, date2: dayjs.Dayjs): boolean {
    return date1.isSameOrAfter(date2);
  }

  static isBetween(
    date: dayjs.Dayjs,
    start: dayjs.Dayjs,
    end: dayjs.Dayjs,
  ): boolean {
    return date.isBetween(start, end, null, '[]');
  }

  static addDays(date: dayjs.Dayjs, days: number): dayjs.Dayjs {
    return date.add(days, 'day');
  }

  static subtractDays(date: dayjs.Dayjs, days: number): dayjs.Dayjs {
    return date.subtract(days, 'day');
  }
}

export default DateUtil;