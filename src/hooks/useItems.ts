import {useContext} from 'react';
import {Item} from '../models';
import {ItemsContext} from '../contexts';

export const useItems = (): Item[] => {
  const {items, isLoading, error} = useContext(ItemsContext);

  if (error) {
    throw error;
  }

  if (isLoading || items === null) {
    throw new Error('Items are still loading');
  }

  return items;
};
