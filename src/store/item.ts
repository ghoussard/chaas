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
import {Item} from '../models';

const ITEM_COLLECTION_NAME = 'items';

const itemConverter: FirestoreDataConverter<Item> = {
  toFirestore(item) {
    return item;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<Item>) {
    return snapshot.data();
  },
};

export async function loadEnabledItems(
  firestore: Firestore,
): Promise<Item[]> {
  const collectionReference = collection(firestore, ITEM_COLLECTION_NAME);

  const querySnapshot = await getDocs(
    query(
      collectionReference,
      where('enabled', '==', true),
      orderBy('name'),
    ).withConverter(itemConverter),
  );

  return querySnapshot.docs.map((document) => document.data());
}
