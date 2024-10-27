import {createRef, ReactNode} from 'react';
import {describe, it, expect, vi} from 'vitest';
import {renderWithChakra} from '../utils/tests';
import {FocusableElementRefContext} from '../contexts';
import {AccountDrawer} from './AccountDrawer';

const renderWithProviders = (children: ReactNode) =>
  renderWithChakra(
    <FocusableElementRefContext.Provider value={createRef()}>
      {children}
    </FocusableElementRefContext.Provider>,
  );

const name = 'Luc Bernard';

describe('AccountDrawer component', () => {
  it('is closed', () => {
    const {queryByText} = renderWithProviders(
      <AccountDrawer isOpen={false} name={name} onClose={vi.fn()} />,
    );

    expect(queryByText(name)).not.toBeInTheDocument();
  });

  it('is open', () => {
    const {getByText} = renderWithProviders(
      <AccountDrawer isOpen={true} name={name} onClose={vi.fn()} />,
    );

    expect(getByText(name)).toBeInTheDocument();
  });
});
