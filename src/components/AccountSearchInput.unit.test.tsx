import {createRef, ReactNode} from 'react';
import {describe, it, expect, vi} from 'vitest';
import userEvent from '@testing-library/user-event';
import {renderWithChakra} from '../utils/tests';
import {FocusableElementRefContext} from '../contexts';
import {ShortcutHandlers} from '../hooks';
import {AccountSearchInput} from './AccountSearchInput';

let emulateCrtlF: () => void;
let emulateCrtlU: () => void;
vi.mock('../hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useOnKeyboardShortcuts: (handlers: ShortcutHandlers) => {
    emulateCrtlF = handlers.f;
    emulateCrtlU = handlers.u;
  },
}));

const renderWithProviders = (children: ReactNode) =>
  renderWithChakra(
    <FocusableElementRefContext.Provider value={createRef()}>
      {children}
    </FocusableElementRefContext.Provider>,
  );

describe('AccountSearchInput component', () => {
  it('is cleared on keyboard shorcut', () => {
    const onChange = vi.fn();

    renderWithProviders(
      <AccountSearchInput value={'Luc Bernard'} onChange={onChange} />,
    );

    emulateCrtlU();

    expect(onChange).toBeCalledWith('');
  });

  it('is focused on keyboard shorcut', () => {
    const {getByTestId} = renderWithProviders(
      <AccountSearchInput value={'Luc Bernard'} onChange={vi.fn()} />,
    );

    emulateCrtlF();

    expect(getByTestId('account-search-input')).toHaveFocus();
  });

  it('notifies on input change', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    const {getByTestId} = renderWithProviders(
      <AccountSearchInput value={'Luc Bernard'} onChange={onChange} />,
    );

    await user.type(getByTestId('account-search-input'), 'o');

    expect(onChange).toBeCalledWith('Luc Bernardo');
  });
});
