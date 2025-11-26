import {useContext} from 'react';
import {Item} from '../models';
import {ItemsContext} from '../contexts';

export const useItems = (): Item[] | null => {
  const {items, isLoading, error} = useContext(ItemsContext);

  if (error) {
    throw error;
  }

  if (isLoading || items === null) {
    return null;
  }

  return items;
};
