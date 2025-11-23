import {describe, it, expect, vi} from 'vitest';
import userEvent from '@testing-library/user-event';
import {renderWithChakra} from '../utils/tests';
import {TransactionList} from './TransactionList';
import {Transaction} from '../models';

const mockPurchaseTransaction: Transaction = {
  id: 'transaction-1',
  type: 'purchase',
  account: 'account-1',
  item: {
    id: 'item-1',
    name: 'Coffee',
    price: 2.5,
    enabled: true,
  },
  timestamp: 1700000000000,
};

const mockPaymentTransaction: Transaction = {
  id: 'transaction-2',
  type: 'payment',
  account: 'account-1',
  amount: 10,
  timestamp: 1700000100000,
};

describe('TransactionList component', () => {
  it('shows loading spinner when loading', () => {
    const {getByText} = renderWithChakra(
      <TransactionList transactions={null} isLoading={true} />,
    );

    expect(getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when no transactions', () => {
    const {getByText} = renderWithChakra(
      <TransactionList transactions={[]} isLoading={false} />,
    );

    expect(getByText('No transactions yet')).toBeInTheDocument();
  });

  it('displays purchase transaction correctly', () => {
    const {getByText} = renderWithChakra(
      <TransactionList
        transactions={[mockPurchaseTransaction]}
        isLoading={false}
      />,
    );

    expect(getByText('Purchase')).toBeInTheDocument();
    expect(getByText('Coffee')).toBeInTheDocument();
    expect(getByText('-2.5€')).toBeInTheDocument();
  });

  it('displays payment transaction correctly', () => {
    const {getByText} = renderWithChakra(
      <TransactionList
        transactions={[mockPaymentTransaction]}
        isLoading={false}
      />,
    );

    expect(getByText('Payment')).toBeInTheDocument();
    expect(getByText('+10€')).toBeInTheDocument();
  });

  it('does not show delete button when onDelete is not provided', () => {
    const {queryByLabelText} = renderWithChakra(
      <TransactionList
        transactions={[mockPurchaseTransaction]}
        isLoading={false}
      />,
    );

    expect(queryByLabelText('Delete transaction')).not.toBeInTheDocument();
  });

  it('shows delete button when onDelete is provided', () => {
    const {getByLabelText} = renderWithChakra(
      <TransactionList
        transactions={[mockPurchaseTransaction]}
        isLoading={false}
        onDelete={vi.fn()}
      />,
    );

    expect(getByLabelText('Delete transaction')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    const {getByLabelText} = renderWithChakra(
      <TransactionList
        transactions={[mockPurchaseTransaction]}
        isLoading={false}
        onDelete={onDelete}
      />,
    );

    await user.click(getByLabelText('Delete transaction'));

    expect(onDelete).toHaveBeenCalledWith(mockPurchaseTransaction);
  });

  it('displays multiple transactions', () => {
    const {getByText} = renderWithChakra(
      <TransactionList
        transactions={[mockPurchaseTransaction, mockPaymentTransaction]}
        isLoading={false}
      />,
    );

    expect(getByText('Purchase')).toBeInTheDocument();
    expect(getByText('Payment')).toBeInTheDocument();
    expect(getByText('Coffee')).toBeInTheDocument();
  });
});
