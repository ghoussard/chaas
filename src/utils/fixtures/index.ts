import {
  collection,
  doc,
  Firestore,
  getDocs,
  setDoc,
  writeBatch,
  query,
  limit,
} from 'firebase/firestore';
import {Account, Item, Transaction} from '../../models';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {FirebaseError} from 'firebase/app';

export enum Dataset {
  DEV = 'dev',
  TEST = 'test',
  PROD = 'prod',
}

export const clearFirestoreData = async (firestore: Firestore) => {
  const collections = ['accounts', 'items', 'transactions'];

  for (const collectionName of collections) {
    let hasMore = true;
    while (hasMore) {
      const snapshot = await getDocs(
        query(collection(firestore, collectionName), limit(100)),
      );

      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      const batch = writeBatch(firestore);
      snapshot.docs.forEach((document) => {
        batch.delete(doc(firestore, collectionName, document.id));
      });
      await batch.commit();

      hasMore = snapshot.docs.length === 100;
    }
  }
};

const getData = async <T>(name: string, dataset: Dataset): Promise<T> => {
  const {default: data} = (await import(
    `./datasets/${dataset}/${name}.json`
  )) as {default: T};
  return data;
};

export const loadAccounts = async (firestore: Firestore, dataset: Dataset) => {
  const accounts = await getData<Account[]>('accounts', dataset);

  const accountsCollection = collection(firestore, 'accounts');
  const batchSize = 500; // Firestore batch limit
  const batches = Math.ceil(accounts.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const batch = writeBatch(firestore);
    const batchAccounts = accounts.slice(i * batchSize, (i + 1) * batchSize);

    for (const account of batchAccounts) {
      const document = doc(accountsCollection, account.id);
      batch.set(document, account);
    }

    await batch.commit();
  }
};

export const loadItems = async (firestore: Firestore, dataset: Dataset) => {
  const items = await getData<Item[]>('items', dataset);

  const itemsCollection = collection(firestore, 'items');
  const batchSize = 500; // Firestore batch limit
  const batches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const batch = writeBatch(firestore);
    const batchItems = items.slice(i * batchSize, (i + 1) * batchSize);

    for (const item of batchItems) {
      const document = doc(itemsCollection, item.id);
      batch.set(document, item);
    }

    await batch.commit();
  }
};

export const loadTransactions = async (
  firestore: Firestore,
  dataset: Dataset,
) => {
  const transactions = await getData<Transaction[]>('transactions', dataset);

  const transactionsCollection = collection(firestore, 'transactions');
  const batchSize = 500; // Firestore batch limit
  const batches = Math.ceil(transactions.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const batch = writeBatch(firestore);
    const batchTransactions = transactions.slice(
      i * batchSize,
      (i + 1) * batchSize,
    );

    for (const transaction of batchTransactions) {
      const document = doc(transactionsCollection, transaction.id);
      batch.set(document, transaction);
    }

    await batch.commit();
  }
};

export const updateAccountActivity = async (firestore: Firestore) => {
  const accountsCollection = collection(firestore, 'accounts');
  const accountsSnapshot = await getDocs(accountsCollection);
  const transactionsSnapshot = await getDocs(
    collection(firestore, 'transactions'),
  );

  const accounts = accountsSnapshot.docs.map((doc) => doc.data() as Account);
  const transactions = transactionsSnapshot.docs.map(
    (doc) => doc.data() as Transaction,
  );

  for (const account of accounts) {
    const accountTransactions = transactions.filter(
      (transaction) => transaction.account === account.id,
    );
    const totalPurchased = accountTransactions.reduce((acc, transaction) => {
      if (transaction.type === 'purchase') {
        return acc + transaction.item.price;
      }
      return acc;
    }, 0);
    const totalPaid = accountTransactions.reduce((acc, transaction) => {
      if (transaction.type === 'payment') {
        return acc + transaction.amount;
      }
      return acc;
    }, 0);
    const lastPurchaseTimestamp = accountTransactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'purchase') {
          return Math.max(acc, transaction.timestamp);
        }
        return acc;
      },
      0,
    );
    const lastPaymentTimestamp = accountTransactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'payment') {
          return Math.max(acc, transaction.timestamp);
        }
        return acc;
      },
      0,
    );
    const activity = {
      totalPurchased,
      totalPaid,
      lastPurchaseTimestamp:
        lastPurchaseTimestamp === 0 ? null : lastPurchaseTimestamp,
      lastPaymentTimestamp:
        lastPaymentTimestamp === 0 ? null : lastPaymentTimestamp,
    };
    const document = doc(accountsCollection, account.id);
    await setDoc(document, {...account, activity});
  }
};

const isFirebaseError = (e: unknown): e is FirebaseError =>
  typeof e === 'object' &&
  e !== null &&
  'code' in e &&
  typeof e.code === 'string';

export const createUser = async (
  auth: Auth,
  email: string,
  password: string,
) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (e) {
    if (isFirebaseError(e) && e.code === 'auth/email-already-in-use') {
      await signInWithEmailAndPassword(auth, email, password);
      return;
    }

    throw e;
  }
};
