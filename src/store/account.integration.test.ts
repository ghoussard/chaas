import {describe, expect, it as base, vi} from 'vitest';
import {deleteApp} from 'firebase/app';
import {doc, Firestore, getFirestore, updateDoc} from 'firebase/firestore';
import {createAccountStore} from './account';
import {
  clearFirestoreData,
  createUser,
  Dataset,
  loadAccounts,
  loadItems,
  loadTransactions,
  updateAccountActivity,
} from '../utils/fixtures';
import {createFirebaseApp, Env} from '../utils/firebase';
import {getAuth} from 'firebase/auth';

const it = base.extend<{firestore: Firestore}>({
  // eslint-disable-next-line no-empty-pattern
  firestore: async ({}, use) => {
    const app = createFirebaseApp(Env.TEST);
    const firestore = getFirestore(app);
    const auth = getAuth(app);
    await createUser(auth, 'admin@example.com', 'admin123');
    await clearFirestoreData(firestore);
    await loadAccounts(firestore, Dataset.TEST);
    await loadItems(firestore, Dataset.TEST);
    await loadTransactions(firestore, Dataset.TEST);
    await updateAccountActivity(firestore);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(firestore);
    await deleteApp(app);
  },
});

describe('Account store', () => {
  it('has a snapshot equals to null at initialization', ({firestore}) => {
    const accountStore = createAccountStore(firestore);

    expect(accountStore.snapshot()).toBe(null);
  });

  it('fetches snapshot when it is subscribed', async ({firestore}) => {
    const accountStore = createAccountStore(firestore);

    const onSnapshotChange = vi.fn();

    const unsubscribe = accountStore.subscribe(onSnapshotChange);
    await expect.poll(() => onSnapshotChange).toBeCalled();
    expect(accountStore.snapshot()).not.toBeNull();

    unsubscribe();
    expect(accountStore.snapshot()).toBeNull();
  });

  it('fetches snapshot ordered by totalPurchased descendant', async ({
    firestore,
  }) => {
    const accountStore = createAccountStore(firestore);

    const onSnapshotChange = vi.fn();

    const unsubscribe = accountStore.subscribe(onSnapshotChange);
    await expect.poll(() => onSnapshotChange).toBeCalled();
    expect((accountStore.snapshot() ?? [])[0].slack.name).toBe('Luc Bernard');

    unsubscribe();
    expect(accountStore.snapshot()).toBeNull();
  });

  it('notifies when snapshot has changed', async ({firestore}) => {
    const accountStore = createAccountStore(firestore);

    const onSnapshotChange = vi.fn();

    const unsubscribe = accountStore.subscribe(onSnapshotChange);
    await expect.poll(() => onSnapshotChange).toBeCalled();
    expect(accountStore.snapshot()).not.toBeNull();

    await updateDoc(
      doc(firestore, 'accounts', 'd4e5f6a7-8b9c-1d2e-3f4a-5b6c7d8e9f0a'),
      {
        slack: {
          name: 'Luc Bernar',
        },
      },
    );

    await expect.poll(() => onSnapshotChange).toBeCalledTimes(2);
    expect((accountStore.snapshot() ?? [])[0].slack.name).toBe('Luc Bernar');

    unsubscribe();
    expect(accountStore.snapshot()).toBeNull();
  });
});
