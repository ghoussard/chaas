import {describe, expect, it as base, vi} from 'vitest';
import {deleteApp} from 'firebase/app';
import {doc, Firestore, getFirestore, setDoc} from 'firebase/firestore';
import {createAccountStore} from './account';
import {Dataset, loadAccounts} from '../fixtures';
import {createFirebaseApp, Env} from '@chaas/utils';

// eslint-disable-next-line vitest/valid-title
const it = base.extend<{firestore: Firestore}>({
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

  it('notifies when snapshot has changed', async ({firestore}) => {
    const accountStore = createAccountStore(firestore);

    const onSnapshotChange = vi.fn();

    const unsubscribe = accountStore.subscribe(onSnapshotChange);
    await expect.poll(() => onSnapshotChange).toBeCalled();
    expect(accountStore.snapshot()).not.toBeNull();

    await setDoc(doc(firestore, 'accounts', 'U431091T83K'), {
      name: 'Luc Bernar',
    });

    await expect.poll(() => onSnapshotChange).toBeCalledTimes(2);

    unsubscribe();
    expect(accountStore.snapshot()).toBeNull();
  });
});
