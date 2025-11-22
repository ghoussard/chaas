import {createContext} from 'react';
import {Item} from '../models';

export type ItemsContextValue = {
  items: Item[] | null;
  isLoading: boolean;
  error: Error | null;
};

export const ItemsContext = createContext<ItemsContextValue>({
  items: null,
  isLoading: true,
  error: null,
});
