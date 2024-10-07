import {FirebaseApp, FirebaseOptions, initializeApp} from 'firebase/app';
import {connectFirestoreEmulator, getFirestore} from 'firebase/firestore';

const isDevEnv = (): boolean => import.meta.env.DEV;

const getFirebaseAppOptions = (): FirebaseOptions => {
  const baseOptions = {
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  };

  if (isDevEnv()) {
    return baseOptions;
  }

  return {
    ...baseOptions,
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
};

export const createFirebaseApp = (): FirebaseApp => {
  const options = getFirebaseAppOptions();
  console.log(options);
  const app = initializeApp(options);

  if (isDevEnv()) {
    const firestore = getFirestore(app);
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  }

  return app;
};
