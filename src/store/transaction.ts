import {
  Firestore,
  FirestoreDataConverter,
  collection,
  getDocs,
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
): Promise<Transaction[]> {
  const collectionReference = collection(
    firestore,
    TRANSACTION_COLLECTION_NAME,
  );

  const querySnapshot = await getDocs(
    query(
      collectionReference,
      where('account', '==', accountId),
      orderBy('timestamp', 'desc'),
    ).withConverter(transactionConverter),
  );

  return querySnapshot.docs.map((document) => document.data());
}
