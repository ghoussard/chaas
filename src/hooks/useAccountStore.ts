import {useContext} from 'react';
import {AccountStore} from '../store';
import {StoreContext} from '../contexts';

export const useAccountStore = (): AccountStore => {
  const {account} = useContext(StoreContext);

  if (account === null) {
    throw new Error('Account store has not been initialized');
  }

  return account;
};
