import {describe, it, expect, vi} from 'vitest';
import {renderHook} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useOnKeyboardShortcuts} from './useOnKeyboardShortcuts';

describe('useOnKeyboardShortcuts hook', () => {
  it('catches keyboard shortcuts and calls handlers', async () => {
    const user = userEvent.setup();

    const firstShortcut = vi.fn();
    const secondShortcut = vi.fn();

    renderHook(() => {
      useOnKeyboardShortcuts({
        a: firstShortcut,
        b: secondShortcut,
      });
    });

    await user.keyboard('{Control>}{a}');

    expect(firstShortcut).toBeCalled();
    expect(secondShortcut).not.toBeCalled();

    await user.keyboard('{Control>}{b}');

    expect(secondShortcut).toBeCalled();
  });
});
