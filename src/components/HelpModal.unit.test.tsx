import {createRef, ReactNode} from 'react';
import {describe, it, expect, vi} from 'vitest';
import {renderWithChakra} from '../utils/tests';
import {FocusableElementRefContext} from '../contexts';
import {ShortcutHandlers} from '../hooks';
import {HelpModal} from './HelpModal';

let emulateCrtlH: () => void;
vi.mock('../hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useOnKeyboardShortcuts: (handlers: ShortcutHandlers) => {
    emulateCrtlH = handlers.h;
  },
}));

const renderWithProviders = (children: ReactNode) =>
  renderWithChakra(
    <FocusableElementRefContext.Provider value={createRef()}>
      {children}
    </FocusableElementRefContext.Provider>,
  );

describe('HelpModal component', () => {
  it('is hidden at render', () => {
    const {queryByText} = renderWithProviders(<HelpModal />);

    expect(queryByText('Help')).not.toBeInTheDocument();
  });

  it('is displayed on keyboard shortcut', async () => {
    const {getByText} = renderWithProviders(<HelpModal />);

    emulateCrtlH();

    await expect.poll(() => getByText('Help')).toBeInTheDocument();
  });
});
