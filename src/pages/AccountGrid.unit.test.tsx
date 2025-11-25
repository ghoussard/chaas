import {describe, it, expect, vi, beforeAll} from 'vitest';
import userEvent from '@testing-library/user-event';
import {renderWithChakra} from '../utils/tests';
import {AccountGrid} from './AccountGrid';
import {Account} from '../models';

// Polyfill for Chakra UI Menu scrollTo
beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
});

// Mock hooks
vi.mock('../hooks', async () => {
  const actual = await vi.importActual('../hooks');
  return {
    ...actual,
    useAccounts: vi.fn(),
    useAuth: () => ({
      logOut: vi.fn(),
      isLoggedIn: true,
      auth: {} as any,
    }),
    useOnKeyboardShortcuts: vi.fn(),
    useFocusableElementRef: () => ({current: null}),
    useItems: () => [
      {
        id: 'item-1',
        name: 'Coffee',
        price: 2.5,
        enabled: true,
        picture: 'coffee.png',
      },
    ],
  };
});

// Mock store and services
vi.mock('../store', () => ({
  loadAccountTransactions: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services', () => ({
  chargePurchase: vi.fn().mockResolvedValue(undefined),
  chargePurchases: vi.fn().mockResolvedValue(undefined),
  addPayment: vi.fn().mockResolvedValue(undefined),
  deleteTransaction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({} as any)),
}));

const mockAccounts: Account[] = [
  {
    id: '1',
    slack: {
      id: 'slack-1',
      name: 'Alice Johnson',
      username: 'alice',
      pictureUrl: 'alice.jpg',
    },
    activity: {
      totalPurchased: 50,
      totalPaid: 30,
      lastPurchaseTimestamp: 1700000000000,
      lastPaymentTimestamp: 1699000000000,
    },
    isEmployee: false,
  },
  {
    id: '2',
    slack: {
      id: 'slack-2',
      name: 'Bob Smith',
      username: 'bob',
      pictureUrl: 'bob.jpg',
    },
    activity: {
      totalPurchased: 20,
      totalPaid: 40,
      lastPurchaseTimestamp: 1700100000000,
      lastPaymentTimestamp: 1699100000000,
    },
    isEmployee: false,
  },
  {
    id: '3',
    slack: {
      id: 'slack-3',
      name: 'Charlie Brown',
      username: 'charlie',
      pictureUrl: 'charlie.jpg',
    },
    activity: {
      totalPurchased: 30,
      totalPaid: 30,
      lastPurchaseTimestamp: 1699900000000,
      lastPaymentTimestamp: 1699900000000,
    },
    isEmployee: false,
  },
];

const renderAccountGrid = () => {
  return renderWithChakra(<AccountGrid />);
};

describe('AccountGrid sorting', () => {
  it('defaults to sorting by last transaction (most recent first)', async () => {
    const {useAccounts} = await import('../hooks');
    (useAccounts as any).mockReturnValue(mockAccounts);

    const {getAllByTestId} = renderAccountGrid();

    const cards = getAllByTestId(/^account-card-/);

    // Bob (1700100000000) should be first, Alice (1700000000000) second, Charlie (1699900000000) third
    expect(cards[0]).toHaveAttribute('data-testid', 'account-card-2');
    expect(cards[1]).toHaveAttribute('data-testid', 'account-card-1');
    expect(cards[2]).toHaveAttribute('data-testid', 'account-card-3');
  });

  it('sorts by debt (most debt first)', async () => {
    const {useAccounts} = await import('../hooks');
    (useAccounts as any).mockReturnValue(mockAccounts);
    const user = userEvent.setup();

    const {getAllByTestId, getByRole} = renderAccountGrid();

    // Open sort menu and select "Debt"
    await user.click(getByRole('button', {name: 'Last Transaction'}));
    await user.click(getByRole('menuitem', {name: 'Debt'}));

    const cards = getAllByTestId(/^account-card-/);

    // Alice (-20), Charlie (0), Bob (+20)
    expect(cards[0]).toHaveAttribute('data-testid', 'account-card-1');
    expect(cards[1]).toHaveAttribute('data-testid', 'account-card-3');
    expect(cards[2]).toHaveAttribute('data-testid', 'account-card-2');
  });

  it('sorts by total paid (highest first)', async () => {
    const {useAccounts} = await import('../hooks');
    (useAccounts as any).mockReturnValue(mockAccounts);
    const user = userEvent.setup();

    const {getAllByTestId, getByRole} = renderAccountGrid();

    // Open sort menu and select "Total Paid"
    await user.click(getByRole('button', {name: 'Last Transaction'}));
    await user.click(getByRole('menuitem', {name: 'Total Paid'}));

    const cards = getAllByTestId(/^account-card-/);

    // Bob (40), Charlie (30), Alice (30)
    // Note: Bob should be first with 40, then Charlie and Alice both have 30
    expect(cards[0]).toHaveAttribute('data-testid', 'account-card-2');
    // Charlie and Alice both have 30, so their order may vary
  });
});
