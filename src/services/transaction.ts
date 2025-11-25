import {
  Firestore,
  collection,
  doc,
  writeBatch,
  increment,
} from 'firebase/firestore';
import {Item, Transaction} from '../models';

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
  items: {item: Item; quantity: number}[],
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

/**
 * Deletes a transaction and reverses its impact on account balances.
 *
 * NOTE: This function does NOT update lastPurchaseTimestamp or lastPaymentTimestamp.
 * Recalculating these would require querying all remaining transactions, which:
 * - Breaks the atomic batch update pattern
 * - Has significant performance cost
 * - Is not critical for core functionality (timestamps are used for sorting only)
 *
 * If accurate timestamps after deletion are required, consider implementing a
 * background job or accepting the trade-off that timestamps may be stale.
 */
export async function deleteTransaction(
  firestore: Firestore,
  transaction: Transaction,
): Promise<void> {
  const batch = writeBatch(firestore);
  const transactionRef = doc(firestore, 'transactions', transaction.id);
  const accountRef = doc(firestore, 'accounts', transaction.account);

  // Delete the transaction document
  batch.delete(transactionRef);

  // Reverse the account activity changes
  if (transaction.type === 'purchase') {
    batch.update(accountRef, {
      'activity.totalPurchased': increment(-transaction.item.price),
    });
  } else {
    batch.update(accountRef, {
      'activity.totalPaid': increment(-transaction.amount),
    });
  }

  await batch.commit();
}
