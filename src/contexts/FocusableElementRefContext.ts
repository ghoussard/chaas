import {createContext, RefObject} from 'react';
import {FocusableElement} from '../models';

export const FocusableElementRefContext =
  createContext<RefObject<FocusableElement> | null>(null);
