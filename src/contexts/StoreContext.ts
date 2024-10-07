import {createContext} from 'react';
import {Firestore} from 'firebase/firestore';
import {createAccountStore, AccountStore} from '../store';

type StoreContextValue = {
  account: AccountStore | null;
};

export const StoreContext = createContext<StoreContextValue>({
  account: null,
});

export const createStoreContextValue = (
  firestore: Firestore,
): StoreContextValue => {
  const account = createAccountStore(firestore);

  return {
    account,
  };
};
