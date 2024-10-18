import {Input} from '@chakra-ui/react';
import {useRef, forwardRef, useCallback, useImperativeHandle} from 'react';
import {useOnKeyboardShortcuts} from '../hooks';
import {FocusableElement} from '../models';

type AccountSearchInputProps = {
  value: string;
  onChange: (newValue: string) => void;
};

export const AccountSearchInput = forwardRef<
  FocusableElement,
  AccountSearchInputProps
>(function AccountSearchInput({value, onChange}, ref) {
  const innerRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: (options) => innerRef.current?.focus(options),
  }));

  const focusInput = useCallback(() => {
    innerRef.current?.focus();
  }, [innerRef]);

  const clearValue = useCallback(() => {
    onChange('');
  }, [onChange]);

  useOnKeyboardShortcuts({
    f: focusInput,
    u: clearValue,
  });

  return (
    <Input
      autoFocus={true}
      ref={innerRef}
      placeholder={'Who wants a drink?'}
      size={'lg'}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
    />
  );
});
