import {describe, it, expect, vi} from 'vitest';
import userEvent from '@testing-library/user-event';
import {renderWithChakra} from '../utils/tests';
import {DrinkCard} from './DrinkCard';
import {Item} from '../models';

const mockItem: Item = {
  id: 'item-1',
  name: 'Coffee',
  price: 2.5,
  enabled: true,
  picture: 'coffee.png',
};

describe('DrinkCard component', () => {
  it('displays item name and price', () => {
    const {getByText} = renderWithChakra(
      <DrinkCard
        item={mockItem}
        quantity={0}
        onQuickCharge={vi.fn()}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
      />,
    );

    expect(getByText('Coffee')).toBeInTheDocument();
    expect(getByText('2.5€')).toBeInTheDocument();
  });

  it('shows quantity badge when quantity > 0', () => {
    const {container} = renderWithChakra(
      <DrinkCard
        item={mockItem}
        quantity={3}
        onQuickCharge={vi.fn()}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
      />,
    );

    // Badge should be visible
    const badge = container.querySelector('.chakra-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3');
  });

  it('does not show quantity badge when quantity is 0', () => {
    const {container} = renderWithChakra(
      <DrinkCard
        item={mockItem}
        quantity={0}
        onQuickCharge={vi.fn()}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
      />,
    );

    // Badge should not be present
    const badge = container.querySelector('.chakra-badge');
    expect(badge).not.toBeInTheDocument();
  });

  it('calls onQuickCharge when image is clicked', async () => {
    const onQuickCharge = vi.fn();
    const user = userEvent.setup();

    const {getByAltText} = renderWithChakra(
      <DrinkCard
        item={mockItem}
        quantity={0}
        onQuickCharge={onQuickCharge}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
      />,
    );

    await user.click(getByAltText('Coffee'));

    expect(onQuickCharge).toHaveBeenCalledWith(mockItem);
  });

  it('calls onIncrement when + button is clicked', async () => {
    const onIncrement = vi.fn();
    const user = userEvent.setup();

    const {getByLabelText} = renderWithChakra(
      <DrinkCard
        item={mockItem}
        quantity={0}
        onQuickCharge={vi.fn()}
        onIncrement={onIncrement}
        onDecrement={vi.fn()}
      />,
    );

    await user.click(getByLabelText('Increase quantity'));

    expect(onIncrement).toHaveBeenCalledWith(mockItem);
  });

  it('calls onDecrement when - button is clicked', async () => {
    const onDecrement = vi.fn();
    const user = userEvent.setup();

    const {getByLabelText} = renderWithChakra(
      <DrinkCard
        item={mockItem}
        quantity={1}
        onQuickCharge={vi.fn()}
        onIncrement={vi.fn()}
        onDecrement={onDecrement}
      />,
    );

    await user.click(getByLabelText('Decrease quantity'));

    expect(onDecrement).toHaveBeenCalledWith(mockItem);
  });

  it('disables decrement button when quantity is 0', () => {
    const {getByLabelText} = renderWithChakra(
      <DrinkCard
        item={mockItem}
        quantity={0}
        onQuickCharge={vi.fn()}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
      />,
    );

    expect(getByLabelText('Decrease quantity')).toBeDisabled();
  });
});
