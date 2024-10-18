import {PropsWithChildren} from 'react';
import {renderHook} from '@testing-library/react';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {useAccountStore} from './useAccountStore';
import {StoreContext, StoreContextValue} from '../contexts';
import {AccountStore} from '../store';

const createContext = (value: StoreContextValue) =>
  function Context({children}: PropsWithChildren) {
    return (
      <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
    );
  };

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(vi.fn());
});

describe('useAccountStore hook', () => {
  it('throws an error when the context or its value has not been initialized', () => {
    const expectedErrorMessage = 'Account store has not been initialized';

    expect(() => renderHook(() => useAccountStore())).toThrowError(
      expectedErrorMessage,
    );

    expect(() =>
      renderHook(() => useAccountStore(), {
        wrapper: createContext({
          account: null,
        }),
      }),
    ).toThrowError(expectedErrorMessage);
  });

  it('provides an account store from the context', () => {
    const accountStore: AccountStore = {
      subscribe: vi.fn(),
      snapshot: vi.fn(),
    };

    const {result} = renderHook(() => useAccountStore(), {
      wrapper: createContext({
        account: accountStore,
      }),
    });

    expect(result.current).toBe(accountStore);
  });
});
