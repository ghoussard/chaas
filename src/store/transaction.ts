import {
  Firestore,
  FirestoreDataConverter,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  where,
} from 'firebase/firestore';
import {Transaction} from '../models';

const TRANSACTION_COLLECTION_NAME = 'transactions';

const transactionConverter: FirestoreDataConverter<Transaction> = {
  toFirestore(transaction) {
    return transaction;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<Transaction>) {
    return snapshot.data();
  },
};

export async function loadAccountTransactions(
  firestore: Firestore,
  accountId: string,
  limitCount?: number,
): Promise<Transaction[]> {
  const collectionReference = collection(
    firestore,
    TRANSACTION_COLLECTION_NAME,
  );

  let q = query(
    collectionReference,
    where('account', '==', accountId),
    orderBy('timestamp', 'desc'),
  );

  if (limitCount) {
    q = query(q, limit(limitCount));
  }

  const querySnapshot = await getDocs(q.withConverter(transactionConverter));

  return querySnapshot.docs.map((document) => document.data());
}
