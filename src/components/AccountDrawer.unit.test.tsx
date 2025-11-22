import {createRef, ReactNode} from 'react';
import {describe, it, expect, vi} from 'vitest';
import {renderWithChakra} from '../utils/tests';
import {FocusableElementRefContext} from '../contexts';
import {AccountDrawer} from './AccountDrawer';

vi.mock('../hooks', async () => {
  const actual = await vi.importActual('../hooks');
  return {
    ...actual,
    useItems: () => [],
  };
});

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
}));

const renderWithProviders = (children: ReactNode) =>
  renderWithChakra(
    <FocusableElementRefContext.Provider value={createRef()}>
      {children}
    </FocusableElementRefContext.Provider>,
  );

const accountId = 'test-account-id';
const name = 'Luc Bernard';
const totalPaid = 20;
const totalPurchased = 10;

describe('AccountDrawer component', () => {
  it('is closed', () => {
    const {queryByText} = renderWithProviders(
      <AccountDrawer
        isOpen={false}
        accountId={accountId}
        name={name}
        totalPaid={totalPaid}
        totalPurchased={totalPurchased}
        onClose={vi.fn()}
      />,
    );

    expect(queryByText(name)).not.toBeInTheDocument();
  });

  it('is open', () => {
    const {getByText} = renderWithProviders(
      <AccountDrawer
        isOpen={true}
        accountId={accountId}
        name={name}
        totalPaid={totalPaid}
        totalPurchased={totalPurchased}
        onClose={vi.fn()}
      />,
    );

    expect(getByText(name)).toBeInTheDocument();
  });
});
