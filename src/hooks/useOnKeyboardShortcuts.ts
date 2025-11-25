import {useCallback, useEffect} from 'react';

export type ShortcutHandlers = Record<string, () => void>;

export const useOnKeyboardShortcuts = (handlers: ShortcutHandlers): void => {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((!e.ctrlKey && !e.metaKey) || !Object.keys(handlers).includes(e.key)) {
        return;
      }

      e.preventDefault();
      handlers[e.key]();
    },
    [handlers],
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);
};
