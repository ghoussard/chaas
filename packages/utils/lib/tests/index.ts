import {Firestore, getFirestore} from 'firebase/firestore';
import {it as base} from 'vitest';
import {createFirebaseApp, Env} from '../firebase';
import {Dataset, loadAccounts} from '../fixtures';
import {deleteApp} from 'firebase/app';

type FirestoreContext = {
  firestore: Firestore;
};

// eslint-disable-next-line vitest/valid-title
export const it = base.extend<FirestoreContext>({
  // eslint-disable-next-line no-empty-pattern
  firestore: async ({}, use) => {
    const app = createFirebaseApp(Env.TEST);
    const firestore = getFirestore(app);
    await loadAccounts(firestore, Dataset.TEST);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(firestore);
    await deleteApp(app);
  },
});
