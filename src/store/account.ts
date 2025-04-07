import {
  Firestore,
  FirestoreDataConverter,
  collection,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import {Account} from '../models';

const ACCOUNT_COLLECTION_NAME = 'accounts';

const accountConverter: FirestoreDataConverter<Account> = {
  toFirestore(account) {
    return account;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<Account>) {
    return snapshot.data();
  },
};

export type AccountStore = {
  snapshot: () => Account[] | null;
  subscribe: (onSnapshotChange: () => void) => () => void;
};

class FirestoreAccountStore implements AccountStore {
  private readonly firestore: Firestore;
  private accounts: Account[] | null;

  public constructor(firestore: Firestore) {
    this.firestore = firestore;
    this.accounts = null;
  }

  public snapshot = (): Account[] | null => {
    return this.accounts;
  };

  public subscribe = (onSnapshotChange: () => void): (() => void) => {
    const collectionReference = collection(
      this.firestore,
      ACCOUNT_COLLECTION_NAME,
    );

    const unsubscribe = onSnapshot(
      query(
        collectionReference,
        orderBy('activity.totalPurchased', 'desc'),
      ).withConverter(accountConverter),
      (querySnapshot) => {
        this.accounts = querySnapshot.docs.map((document) => document.data());
        onSnapshotChange();
      },
    );

    return () => {
      this.accounts = null;
      unsubscribe();
    };
  };
}

export function createAccountStore(firestore: Firestore): AccountStore {
  return new FirestoreAccountStore(firestore);
}
