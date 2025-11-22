import {
  Firestore,
  collection,
  doc,
  writeBatch,
  increment,
} from 'firebase/firestore';
import {Item} from '../models';

export async function chargePurchase(
  firestore: Firestore,
  accountId: string,
  item: Item,
): Promise<void> {
  const batch = writeBatch(firestore);
  const transactionRef = doc(collection(firestore, 'transactions'));
  const accountRef = doc(firestore, 'accounts', accountId);
  const timestamp = Date.now();

  batch.set(transactionRef, {
    id: transactionRef.id,
    type: 'purchase',
    item,
    account: accountId,
    timestamp,
  });

  batch.update(accountRef, {
    'activity.totalPurchased': increment(item.price),
    'activity.lastPurchaseTimestamp': timestamp,
  });

  await batch.commit();
}

export async function chargePurchases(
  firestore: Firestore,
  accountId: string,
  items: Array<{item: Item; quantity: number}>,
): Promise<void> {
  const batch = writeBatch(firestore);
  const accountRef = doc(firestore, 'accounts', accountId);
  const timestamp = Date.now();
  let totalAmount = 0;

  for (const {item, quantity} of items) {
    for (let i = 0; i < quantity; i++) {
      const transactionRef = doc(collection(firestore, 'transactions'));
      batch.set(transactionRef, {
        id: transactionRef.id,
        type: 'purchase',
        item,
        account: accountId,
        timestamp,
      });
      totalAmount += item.price;
    }
  }

  batch.update(accountRef, {
    'activity.totalPurchased': increment(totalAmount),
    'activity.lastPurchaseTimestamp': timestamp,
  });

  await batch.commit();
}

export async function addPayment(
  firestore: Firestore,
  accountId: string,
  amount: number,
): Promise<void> {
  const batch = writeBatch(firestore);
  const transactionRef = doc(collection(firestore, 'transactions'));
  const accountRef = doc(firestore, 'accounts', accountId);
  const timestamp = Date.now();

  batch.set(transactionRef, {
    id: transactionRef.id,
    type: 'payment',
    account: accountId,
    amount,
    timestamp,
  });

  batch.update(accountRef, {
    'activity.totalPaid': increment(amount),
    'activity.lastPaymentTimestamp': timestamp,
  });

  await batch.commit();
}
