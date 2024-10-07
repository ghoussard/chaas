import {RefObject, useContext} from 'react';
import {FocusableElement} from '../models';
import {FocusableElementRefContext} from '../contexts';

export const useFocusableElementRef = (): RefObject<FocusableElement> => {
  const focusableElementRef = useContext(FocusableElementRefContext);

  if (focusableElementRef === null) {
    throw new Error('Focusable element ref has not been initialized');
  }

  return focusableElementRef;
};
