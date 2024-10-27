import {Auth} from 'firebase/auth';
import {createContext} from 'react';

export const AuthContext = createContext<Auth | null>(null);
