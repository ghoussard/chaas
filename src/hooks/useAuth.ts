import {useCallback, useContext, useEffect, useState} from 'react';
import {AuthContext} from '../contexts';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

type AuthResult = {
  isLoggedIn: boolean;
  isLoggingIn: boolean;
  isAuthLoading: boolean;
  logIn: (login: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
};

export const useAuth = (): AuthResult => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const auth = useContext(AuthContext);

  if (auth === null) {
    throw new Error('Auth has not been initialized');
  }

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        setIsLoggedIn(user !== null);
        setIsAuthLoading(false);
      }),
    [auth],
  );

  const logIn = useCallback(
    async (login: string, password: string) => {
      try {
        setIsLoggingIn(true);
        await signInWithEmailAndPassword(auth, login, password);
        setIsLoggingIn(false);
      } catch (e) {
        setIsLoggingIn(false);
        throw e;
      }
    },
    [auth],
  );

  const logOut = useCallback(() => signOut(auth), [auth]);

  return {
    isLoggedIn,
    isLoggingIn,
    isAuthLoading,
    logIn,
    logOut,
  };
};
