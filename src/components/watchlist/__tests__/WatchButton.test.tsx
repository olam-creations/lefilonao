import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, cleanup } from '@testing-library/react';
import WatchButton from '../WatchButton';

// Mock auth
vi.mock('@/lib/auth', () => ({
  getTokenPayload: vi.fn(() => ({ email: 'user@test.fr' })),
}));

import { getTokenPayload } from '@/lib/auth';
const mockedGetTokenPayload = vi.mocked(getTokenPayload);

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetTokenPayload.mockReturnValue({ email: 'user@test.fr' });
});

afterEach(() => {
  cleanup();
});

describe('WatchButton', () => {
  it('renders nothing when no email (unauthenticated)', () => {
    mockedGetTokenPayload.mockReturnValue(null);
    const { container } = render(<WatchButton buyerName="Test Buyer" />);
    expect(container.querySelector('button')).toBeNull();
  });

  it('calls check API on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ watched: false }),
    });

    render(<WatchButton buyerName="Mairie Paris" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/watchlist/check')
      );
    });
  });

  it('shows "Ne plus surveiller" when buyer is watched', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ watched: true, id: 'entry-1' }),
    });

    await act(async () => {
      render(<WatchButton buyerName="Mairie Paris" />);
    });

    await waitFor(() => {
      expect(screen.getByTitle('Ne plus surveiller')).toBeTruthy();
    });
  });

  it('shows "Surveiller cet acheteur" when buyer is not watched', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ watched: false }),
    });

    await act(async () => {
      render(<WatchButton buyerName="Mairie Paris" />);
    });

    await waitFor(() => {
      expect(screen.getByTitle('Surveiller cet acheteur')).toBeTruthy();
    });
  });

  it('toggles to watched on click with POST', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ watched: false }),
    });

    await act(async () => {
      render(<WatchButton buyerName="Mairie Paris" />);
    });

    await waitFor(() => {
      expect(screen.getByTitle('Surveiller cet acheteur')).toBeTruthy();
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ entry: { id: 'new-1' } }),
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      expect(screen.getByTitle('Ne plus surveiller')).toBeTruthy();
    });

    // Verify POST was made
    expect(mockFetch).toHaveBeenCalledWith('/api/watchlist', expect.objectContaining({
      method: 'POST',
    }));
  });

  it('toggles to unwatched on click with DELETE', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ watched: true, id: 'entry-1' }),
    });

    await act(async () => {
      render(<WatchButton buyerName="Mairie Paris" />);
    });

    await waitFor(() => {
      expect(screen.getByTitle('Ne plus surveiller')).toBeTruthy();
    });

    mockFetch.mockResolvedValueOnce({ ok: true });

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      expect(screen.getByTitle('Surveiller cet acheteur')).toBeTruthy();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/watchlist/entry-1', expect.objectContaining({
      method: 'DELETE',
    }));
  });

  it('reverts on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ watched: false }),
    });

    await act(async () => {
      render(<WatchButton buyerName="Mairie Paris" />);
    });

    await waitFor(() => {
      expect(screen.getByTitle('Surveiller cet acheteur')).toBeTruthy();
    });

    mockFetch.mockResolvedValueOnce({ ok: false });

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      expect(screen.getByTitle('Surveiller cet acheteur')).toBeTruthy();
    });
  });

  it('has correct aria-label', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ watched: true, id: 'x' }),
    });

    await act(async () => {
      render(<WatchButton buyerName="Acme" />);
    });

    await waitFor(() => {
      const btn = screen.getByRole('button');
      expect(btn.getAttribute('aria-label')).toBe('Ne plus surveiller');
    });
  });
});
