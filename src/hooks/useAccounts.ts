import {useSyncExternalStore} from 'react';
import {useAccountStore} from './useAccountStore';
import {Account} from '@chaas/common';

export const useAccounts = (searchValue: string): Account[] | null => {
  const {subscribe, snapshot} = useAccountStore();
  const accounts = useSyncExternalStore(subscribe, snapshot);

  if (accounts === null) {
    return null;
  }

  return accounts.filter(
    ({name, username}) =>
      name.includes(searchValue) || username.includes(searchValue),
  );
};
