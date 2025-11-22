import {describe, it, expect, vi} from 'vitest';
import userEvent from '@testing-library/user-event';
import {renderWithChakra} from '../utils/tests';
import {AccountCard} from './AccountCard';
import {AccountDrawerProps} from './AccountDrawer';

vi.mock('./AccountDrawer', () => ({
  AccountDrawer: ({isOpen, name}: AccountDrawerProps) =>
    isOpen && <div>Account of {name}</div>,
}));

const id = 'test-account-id';
const name = 'Luc Bernard';
const pictureUrl = 'https://placehold.co/150';
const totalPaid = 10;
const totalPurchased = 20;

describe('AccountCard component', () => {
  it('displays account details', () => {
    const {getByText} = renderWithChakra(
      <AccountCard
        id={id}
        name={name}
        pictureUrl={pictureUrl}
        totalPaid={totalPaid}
        totalPurchased={totalPurchased}
      />,
    );

    expect(getByText(name)).toBeInTheDocument();
    expect(getByText('-10€')).toBeInTheDocument();
  });

  it('opens account drawer when it is clicked', async () => {
    const user = userEvent.setup();

    const {getByTestId, getByText} = renderWithChakra(
      <AccountCard
        id={id}
        name={name}
        pictureUrl={pictureUrl}
        totalPaid={totalPaid}
        totalPurchased={totalPurchased}
      />,
    );

    await user.click(getByTestId('account-card'));

    expect(getByText('Account of Luc Bernard')).toBeInTheDocument();
  });
});
