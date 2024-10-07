import {renderHook} from '@testing-library/react';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {useFocusableElementRef} from './useFocusableElementRef';
import {FocusableElementRefContext} from '../contexts';
import {PropsWithChildren, RefObject} from 'react';
import {FocusableElement} from '../models';

const createContext = (value: RefObject<FocusableElement> | null) =>
  function Context({children}: PropsWithChildren) {
    return (
      <FocusableElementRefContext.Provider value={value}>
        {children}
      </FocusableElementRefContext.Provider>
    );
  };

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(vi.fn());
});

describe('useFocusableElementRef hook', () => {
  it('throws an error when the context has not been initialized', () => {
    const expectedErrorMessage =
      'Focusable element ref has not been initialized';

    expect(() => renderHook(() => useFocusableElementRef())).toThrowError(
      expectedErrorMessage,
    );

    expect(() =>
      renderHook(() => useFocusableElementRef(), {
        wrapper: createContext(null),
      }),
    ).toThrowError(expectedErrorMessage);
  });

  it('it provides the ref object in the context', () => {
    const ref: RefObject<FocusableElement> = {
      current: null,
    };

    const {result} = renderHook(() => useFocusableElementRef(), {
      wrapper: createContext(ref),
    });

    expect(result.current).toBe(ref);
  });
});
