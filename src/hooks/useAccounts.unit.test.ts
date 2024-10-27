import {beforeEach, describe, expect, it, vi} from 'vitest';
import {renderHook} from '@testing-library/react';
import {Account} from '../models';
import {useAccounts} from './useAccounts';

const accounts: Account[] = [
  {
    id: 'U219077M86B',
    name: 'Claire Johnson',
    username: 'claire.johnson',
    pictureUrl: 'https://placehold.co/150',
    activity: {
      totalPursached: 150,
      totalPaid: 100,
      lastPursacheTimestamp: 1700195501,
      lastPaymentTimestamp: 1710946962,
    },
  },
  {
    id: 'U431091T83K',
    name: 'Luc Bernard',
    username: 'luc.bernard',
    pictureUrl: 'https://placehold.co/150',
    activity: {
      totalPursached: 300,
      totalPaid: 225,
      lastPursacheTimestamp: 1662310314,
      lastPaymentTimestamp: 1713842769,
    },
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
