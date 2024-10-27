import {useCallback, useContext, useEffect, useState} from 'react';
import {AuthContext} from '../contexts';
import {onAuthStateChanged, signInWithEmailAndPassword} from 'firebase/auth';

type AuthResult = {
  isLoggedIn: boolean;
  isLoggingIn: boolean;
  logIn: (password: string) => Promise<void>;
};

class UnableToLogIn extends Error {}

const ADMIN_EMAIL = import.meta.env.PROD
  ? import.meta.env.VITE_FIREBASE_ADMIN_EMAIL
  : 'admin@example.com';

export const useAuth = (): AuthResult => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const auth = useContext(AuthContext);

  if (auth === null) {
    throw new Error('Auth has not been initialized');
  }

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        setIsLoggedIn(user !== null);
      }),
    [auth],
  );

  const logIn = useCallback(
    async (password: string) => {
      try {
        setIsLoggingIn(true);
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
        setIsLoggingIn(false);
      } catch (e) {
        setIsLoggingIn(false);
        console.error(e);
        throw new UnableToLogIn();
      }
    },
    [auth],
  );

  return {
    isLoggedIn,
    isLoggingIn,
    logIn,
  };
};
