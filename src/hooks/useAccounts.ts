import {useSyncExternalStore} from 'react';
import {useAccountStore} from './useAccountStore';
import {Account} from '../models';

export const useAccounts = (searchValue: string): Account[] | null => {
  const {subscribe, snapshot} = useAccountStore();
  const accounts = useSyncExternalStore(subscribe, snapshot);

  if (accounts === null) {
    return accounts;
  }

  return accounts.filter(
    ({name, username}) =>
      name.toLowerCase().includes(searchValue.toLowerCase()) ||
      username.toLowerCase().includes(searchValue.toLowerCase()),
  );
};
