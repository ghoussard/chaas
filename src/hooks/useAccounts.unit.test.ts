import {beforeEach, describe, expect, it, vi} from 'vitest';
import {renderHook} from '@testing-library/react';
import {Account} from '../models';
import {useAccounts} from './useAccounts';

const accounts: Account[] = [
  {
    id: '8f7d3b2a-1c4e-4f8d-9a6b-5c2d1e3f4a5b',
    slack: {
      id: 'U219077M86B',
      name: 'Claire Johnson',
      username: 'claire.johnson',
      pictureUrl: 'https://placehold.co/150',
    },
    activity: {
      totalPurchased: 150,
      totalPaid: 100,
      lastPurchaseTimestamp: 1700195501,
      lastPaymentTimestamp: 1710946962,
    },
    isEmployee: true,
  },
  {
    id: 'd4e5f6a7-8b9c-1d2e-3f4a-5b6c7d8e9f0a',
    slack: {
      id: 'U431091T83K',
      name: 'Luc Bernard',
      username: 'luc.bernard',
      pictureUrl: 'https://placehold.co/150',
    },
    activity: {
      totalPurchased: 300,
      totalPaid: 225,
      lastPurchaseTimestamp: 1662310314,
      lastPaymentTimestamp: 1713842769,
    },
    isEmployee: true,
  },
];

let mockedSnapshot: Account[] | null;

vi.mock('./useAccountStore', () => ({
  useAccountStore: () => ({
    subscribe: vi.fn(),
    snapshot: vi.fn(),
  }),
}));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useSyncExternalStore: vi.fn(() => mockedSnapshot),
}));

beforeEach(() => {
  mockedSnapshot = accounts;
});

describe('useAccouts hooks', () => {
  it('returns null if accounts snapshot is null', () => {
    mockedSnapshot = null;

    const {result} = renderHook(() => useAccounts(''));

    expect(result.current).toBeNull();
  });

  it('returns all accounts for empty search value', () => {
    const {result} = renderHook(() => useAccounts(''));

    expect(result.current).toStrictEqual(accounts);
  });

  it('returns filtered accounts for search value', () => {
    const {result} = renderHook(() => useAccounts('luc'));

    const expectedAccounts = [accounts[1]];

    expect(result.current).toStrictEqual(expectedAccounts);
  });

  it('returns filtered accounts for capitalized search value', () => {
    const {result} = renderHook(() => useAccounts('LUC'));

    const expectedAccounts = [accounts[1]];

    expect(result.current).toStrictEqual(expectedAccounts);
  });
});
