import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WatchlistAlertsFeed from '../WatchlistAlertsFeed';
import type { WatchlistAlert } from '@/components/market/types';

describe('WatchlistAlertsFeed', () => {
  it('shows empty state when no alerts', () => {
    render(<WatchlistAlertsFeed alerts={[]} />);
    expect(screen.getByText('Aucun AO récent de vos acheteurs surveillés')).toBeTruthy();
  });

  it('renders alert cards with title, buyer, and amount', () => {
    const alerts: WatchlistAlert[] = [
      {
        id: '1',
        title: 'Fourniture de serveurs',
        buyer_name: 'Mairie Paris',
        notification_date: '2026-02-05',
        amount: 150000,
        cpv_code: '72000000',
      },
      {
        id: '2',
        title: 'Prestation dev web',
        buyer_name: 'Conseil Régional IDF',
        notification_date: '2026-02-01',
        amount: 0,
        cpv_code: '48000000',
      },
    ];

    render(<WatchlistAlertsFeed alerts={alerts} />);

    expect(screen.getByText('Fourniture de serveurs')).toBeTruthy();
    expect(screen.getByText('Mairie Paris')).toBeTruthy();
    expect(screen.getByText('150k€')).toBeTruthy();
    expect(screen.getByText('IT')).toBeTruthy();

    expect(screen.getByText('Prestation dev web')).toBeTruthy();
    expect(screen.getByText('Conseil Régional IDF')).toBeTruthy();
    expect(screen.getByText('Logiciels')).toBeTruthy();
  });

  it('does not show amount when zero', () => {
    const alerts: WatchlistAlert[] = [
      {
        id: '1',
        title: 'Test AO',
        buyer_name: 'Buyer',
        notification_date: '2026-02-01',
        amount: 0,
        cpv_code: '72000000',
      },
    ];

    render(<WatchlistAlertsFeed alerts={alerts} />);
    expect(screen.queryByText('0€')).toBeNull();
  });
});
