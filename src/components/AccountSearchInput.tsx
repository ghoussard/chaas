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
      data-testid={'account-search-input'}
      autoFocus={true}
      ref={innerRef}
      placeholder={'Who wants a drink?'}
      size={'lg'}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      bg={'white'}
      borderRadius={'12px'}
      border={'1px solid'}
      borderColor={'gray.200'}
      _focus={{
        borderColor: 'blue.400',
        boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
      }}
    />
  );
});
