import {FirebaseApp, FirebaseOptions, initializeApp} from 'firebase/app';
import {connectFirestoreEmulator, getFirestore} from 'firebase/firestore';

export enum Env {
  PROD,
  DEV,
  TEST,
}

const getFirebaseAppOptions = (env: Env): FirebaseOptions => {
  switch (env) {
    case Env.DEV:
      return {
        projectId: 'chaas-dev',
      };
    case Env.TEST:
      return {
        projectId: 'chaas-test',
      };
    case Env.PROD:
      return {
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };
  }
};

export const createFirebaseApp = (env: Env): FirebaseApp => {
  const options = getFirebaseAppOptions(env);
  const app = initializeApp(options);

  if (env !== Env.PROD) {
    const firestore = getFirestore(app);
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  }

  return app;
};
