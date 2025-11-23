import {ReactNode, useEffect, useState} from 'react';
import {Firestore} from 'firebase/firestore';
import {ItemsContext} from './ItemsContext';
import {Item} from '../models';
import {loadEnabledItems} from '../store';

export type ItemsProviderProps = {
  firestore: Firestore;
  children: ReactNode;
};

export const ItemsProvider = ({firestore, children}: ItemsProviderProps) => {
  const [items, setItems] = useState<Item[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadEnabledItems(firestore)
      .then((loadedItems) => {
        setItems(loadedItems);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setError(err as Error);
        setIsLoading(false);
      });
  }, [firestore]);

  return (
    <ItemsContext.Provider value={{items, isLoading, error}}>
      {children}
    </ItemsContext.Provider>
  );
};
