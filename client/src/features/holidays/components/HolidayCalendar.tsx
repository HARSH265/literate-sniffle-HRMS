import dayjs from 'dayjs';
import type { Holiday } from '../services/holidayService';

interface HolidayCalendarProps {
  holidays: Holiday[];
  year: number;
}

const typeColors: Record<string, string> = {
  national: '#1890ff',
  state: '#13c2c2',
  company: '#52c41a',
  festival: '#fa8c16',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HolidayCalendar({ holidays, year }: HolidayCalendarProps) {
  const holidayMap = new Map<string, Holiday[]>();
  holidays.forEach((h) => {
    const key = h.date;
    if (!holidayMap.has(key)) holidayMap.set(key, []);
    holidayMap.get(key)!.push(h);
  });

  const getMonthGrid = (month: number) => {
    const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
    const daysInMonth = start.daysInMonth();
    const startDay = start.day();
    const cells: (dayjs.Dayjs | null)[] = [];

    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(start.date(d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 20,
      padding: '12px 12px',
    }}>
      {months.map((month) => {
        const monthName = dayjs(`${year}-${month}-01`).format('MMMM');
        const cells = getMonthGrid(month);
        return (
          <div key={month} style={{
            border: '1px solid var(--hrms-border)',
            borderRadius: 12,
            padding: 20,
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              textAlign: 'center',
              fontWeight: 600,
              fontSize: 15,
              marginBottom: 16,
              color: 'var(--hrms-text-primary)',
              letterSpacing: 0.3,
            }}>
              {monthName}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
              textAlign: 'center',
            }}>
              {WEEKDAYS.map((d) => (
                <div key={d} style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--hrms-text-muted)',
                  padding: '6px 0',
                  borderBottom: '1px solid var(--hrms-border)',
                  marginBottom: 6,
                }}>{d}</div>
              ))}
              {cells.map((cell, idx) => {
                if (!cell) return <div key={idx} style={{ padding: '6px 0' }} />;
                const dateStr = cell.format('YYYY-MM-DD');
                const dayHolidays = holidayMap.get(dateStr) || [];
                const isToday = cell.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
                return (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      padding: '6px 4px',
                      borderRadius: 8,
                      minHeight: 48,
                      background: dayHolidays.length > 0 ? '#fff7e6' : isToday ? '#e6f7ff' : 'transparent',
                      border: isToday ? '1.5px solid #1890ff' : '1px solid transparent',
                    }}
                  >
                    <div style={{
                      fontWeight: dayHolidays.length > 0 ? 600 : 400,
                      fontSize: 12,
                      color: dayHolidays.length > 0 ? 'var(--hrms-text-primary)' : 'var(--hrms-text-secondary)',
                      marginBottom: 2,
                    }}>
                      {cell.date()}
                    </div>
                    {dayHolidays.slice(0, 2).map((h, hi) => (
                      <div
                        key={hi}
                        style={{
                          fontSize: 9,
                          color: '#fff',
                          background: typeColors[h.type] || '#999',
                          borderRadius: 4,
                          padding: '2px 4px',
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {h.name}
                      </div>
                    ))}
                    {dayHolidays.length > 2 && (
                      <div style={{ fontSize: 9, color: 'var(--hrms-text-muted)', marginTop: 2 }}>
                        +{dayHolidays.length - 2} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}