import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../../test/test-utils';
import { HolidayCalendar } from '../HolidayCalendar';
import type { Holiday } from '../../services/holidayService';

const holidays: Holiday[] = [
  { id: '1', name: 'Republic Day', date: '2026-01-26', type: 'national', applicableTo: 'all', year: 2026, isPaid: true },
  { id: '2', name: 'Holi', date: '2026-03-14', type: 'festival', applicableTo: 'all', year: 2026, isPaid: true },
];

describe('HolidayCalendar', () => {
  it('renders all 12 months', () => {
    render(<HolidayCalendar holidays={holidays} year={2026} />);
    expect(screen.getByText('January')).toBeInTheDocument();
    expect(screen.getByText('December')).toBeInTheDocument();
    expect(screen.getByText('June')).toBeInTheDocument();
  });

  it('renders holiday names', () => {
    render(<HolidayCalendar holidays={holidays} year={2026} />);
    expect(screen.getByText('Republic Day')).toBeInTheDocument();
    expect(screen.getByText('Holi')).toBeInTheDocument();
  });

  it('renders weekday headers', () => {
    render(<HolidayCalendar holidays={holidays} year={2026} />);
    expect(screen.getAllByText('Sun')).toHaveLength(12);
    expect(screen.getAllByText('Mon')).toHaveLength(12);
    expect(screen.getAllByText('Sat')).toHaveLength(12);
  });

  it('renders without holidays', () => {
    render(<HolidayCalendar holidays={[]} year={2026} />);
    expect(screen.getByText('January')).toBeInTheDocument();
    expect(screen.getByText('December')).toBeInTheDocument();
  });
});
