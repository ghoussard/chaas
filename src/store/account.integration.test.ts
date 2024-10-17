import {describe, expect, it as base, vi} from 'vitest';
import {deleteApp} from 'firebase/app';
import {Firestore, getFirestore} from 'firebase/firestore';
import {createAccountStore} from './account';
import {Dataset, loadAccounts} from '../fixtures';
import {createFirebaseApp, Env} from '../firebase';

// @todo Fix lint of this file

const it = base.extend<{firestore: Firestore}>({
  firestore: async ({}, use) => {
    const app = createFirebaseApp(Env.TEST);
    const firestore = getFirestore(app);
    await loadAccounts(firestore, Dataset.TEST);
    await use(firestore);
    await deleteApp(app);
  },
});

describe('Account store', () => {
  it('has a snapshot equals to null at initialization', ({firestore}) => {
    const accountStore = createAccountStore(firestore);

    expect(accountStore.snapshot()).toBe(null);
  });

  it('can be subscribed and unsubscribed', async ({firestore}) => {
    const accountStore = createAccountStore(firestore);

    const onSnapshotChange = vi.fn();
    const unsubscribe = accountStore.subscribe(onSnapshotChange);
    await expect.poll(() => onSnapshotChange).toBeCalled();
    expect(accountStore.snapshot()).not.toBeNull();

    unsubscribe();
    expect(accountStore.snapshot()).toBeNull();
  });
});
