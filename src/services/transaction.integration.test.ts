import {describe, expect, it as base} from 'vitest';
import {deleteApp} from 'firebase/app';
import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
} from 'firebase/firestore';
import {
  chargePurchase,
  chargePurchases,
  addPayment,
  deleteTransaction,
} from './transaction';
import {loadAccountTransactions} from '../store';
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
import {Item, Transaction} from '../models';

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

// Using Louis Moreau's account - has no fixture transactions
const testAccountId = 'b2c3d4e5-f6a7-8b9c-1d2e-3f4a5b6c7d8';
const testItem: Item = {
  id: 'item-1',
  name: 'Coffee',
  price: 2.5,
  enabled: true,
  picture: 'chaquip_logo.png',
};

describe('Transaction service', () => {
  describe('chargePurchase', () => {
    it('creates a purchase transaction with UUID format', async ({
      firestore,
    }) => {
      await chargePurchase(firestore, testAccountId, testItem);

      const transactions = await getDocs(
        query(
          collection(firestore, 'transactions'),
          where('account', '==', testAccountId),
          where('type', '==', 'purchase'),
        ),
      );
      const lastTransaction = transactions.docs[
        transactions.docs.length - 1
      ].data() as Transaction;

      // Verify ID is in UUID format (8-4-4-4-12 hex chars)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(lastTransaction.id).toMatch(uuidRegex);
    });

    it('creates a purchase transaction', async ({firestore}) => {
      const initialTransactions = await getDocs(
        query(
          collection(firestore, 'transactions'),
          where('account', '==', testAccountId),
        ),
      );
      const initialCount = initialTransactions.size;

      await chargePurchase(firestore, testAccountId, testItem);

      const updatedTransactions = await getDocs(
        query(
          collection(firestore, 'transactions'),
          where('account', '==', testAccountId),
        ),
      );

      expect(updatedTransactions.size).toBe(initialCount + 1);
    });

    it('updates account totalPurchased', async ({firestore}) => {
      const accountRef = doc(firestore, 'accounts', testAccountId);
      const initialAccount = await getDoc(accountRef);
      const initialData = initialAccount.data() as {
        activity?: {totalPurchased?: number};
      };
      const initialTotalPurchased = initialData.activity?.totalPurchased ?? 0;

      await chargePurchase(firestore, testAccountId, testItem);

      const updatedAccount = await getDoc(accountRef);
      const updatedData = updatedAccount.data() as {
        activity?: {totalPurchased?: number};
      };
      const updatedTotalPurchased = updatedData.activity?.totalPurchased ?? 0;

      expect(updatedTotalPurchased).toBe(
        initialTotalPurchased + testItem.price,
      );
    });

    it('updates account lastPurchaseTimestamp', async ({firestore}) => {
      const accountRef = doc(firestore, 'accounts', testAccountId);

      const beforeTimestamp = Date.now();
      await chargePurchase(firestore, testAccountId, testItem);
      const afterTimestamp = Date.now();

      const updatedAccount = await getDoc(accountRef);
      const updatedData = updatedAccount.data() as {
        activity?: {lastPurchaseTimestamp?: number};
      };
      const lastPurchaseTimestamp = updatedData.activity?.lastPurchaseTimestamp;

      expect(lastPurchaseTimestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(lastPurchaseTimestamp).toBeLessThanOrEqual(afterTimestamp);
    });
  });

  describe('chargePurchases', () => {
    it('creates multiple purchase transactions', async ({firestore}) => {
      const initialTransactions = await getDocs(
        query(
          collection(firestore, 'transactions'),
          where('account', '==', testAccountId),
        ),
      );
      const initialCount = initialTransactions.size;

      const items = [
        {item: testItem, quantity: 2},
        {
          item: {...testItem, id: 'item-2', name: 'Tea', price: 1.5},
          quantity: 1,
        },
      ];

      await chargePurchases(firestore, testAccountId, items);

      const updatedTransactions = await getDocs(
        query(
          collection(firestore, 'transactions'),
          where('account', '==', testAccountId),
        ),
      );

      expect(updatedTransactions.size).toBe(initialCount + 3); // 2 coffees + 1 tea
    });

    it('updates account totalPurchased with sum of all items', async ({
      firestore,
    }) => {
      const accountRef = doc(firestore, 'accounts', testAccountId);
      const initialAccount = await getDoc(accountRef);
      const initialData = initialAccount.data() as {
        activity?: {totalPurchased?: number};
      };
      const initialTotalPurchased = initialData.activity?.totalPurchased ?? 0;

      const items = [
        {item: testItem, quantity: 2}, // 2 * 2.5 = 5
        {
          item: {...testItem, id: 'item-2', name: 'Tea', price: 1.5},
          quantity: 1,
        }, // 1.5
      ];
      const expectedTotal = 5 + 1.5;

      await chargePurchases(firestore, testAccountId, items);

      const updatedAccount = await getDoc(accountRef);
      const updatedData = updatedAccount.data() as {
        activity?: {totalPurchased?: number};
      };
      const updatedTotalPurchased = updatedData.activity?.totalPurchased ?? 0;

      expect(updatedTotalPurchased).toBe(initialTotalPurchased + expectedTotal);
    });
  });

  describe('addPayment', () => {
    it('creates a payment transaction with UUID format', async ({
      firestore,
    }) => {
      await addPayment(firestore, testAccountId, 10);

      const transactions = await getDocs(
        query(
          collection(firestore, 'transactions'),
          where('account', '==', testAccountId),
          where('type', '==', 'payment'),
        ),
      );
      const lastTransaction = transactions.docs[
        transactions.docs.length - 1
      ].data() as Transaction;

      // Verify ID is in UUID format (8-4-4-4-12 hex chars)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(lastTransaction.id).toMatch(uuidRegex);
    });

    it('creates a payment transaction', async ({firestore}) => {
      const initialTransactions = await getDocs(
        query(
          collection(firestore, 'transactions'),
          where('account', '==', testAccountId),
          where('type', '==', 'payment'),
        ),
      );
      const initialCount = initialTransactions.size;

      await addPayment(firestore, testAccountId, 10);

      const updatedTransactions = await getDocs(
        query(
          collection(firestore, 'transactions'),
          where('account', '==', testAccountId),
          where('type', '==', 'payment'),
        ),
      );

      expect(updatedTransactions.size).toBe(initialCount + 1);
    });

    it('updates account totalPaid', async ({firestore}) => {
      const accountRef = doc(firestore, 'accounts', testAccountId);
      const initialAccount = await getDoc(accountRef);
      const initialData = initialAccount.data() as {
        activity?: {totalPaid?: number};
      };
      const initialTotalPaid = initialData.activity?.totalPaid ?? 0;

      const paymentAmount = 10;
      await addPayment(firestore, testAccountId, paymentAmount);

      const updatedAccount = await getDoc(accountRef);
      const updatedData = updatedAccount.data() as {
        activity?: {totalPaid?: number};
      };
      const updatedTotalPaid = updatedData.activity?.totalPaid ?? 0;

      expect(updatedTotalPaid).toBe(initialTotalPaid + paymentAmount);
    });

    it('updates account lastPaymentTimestamp', async ({firestore}) => {
      const accountRef = doc(firestore, 'accounts', testAccountId);

      const beforeTimestamp = Date.now();
      await addPayment(firestore, testAccountId, 10);
      const afterTimestamp = Date.now();

      const updatedAccount = await getDoc(accountRef);
      const updatedData = updatedAccount.data() as {
        activity?: {lastPaymentTimestamp?: number};
      };
      const lastPaymentTimestamp = updatedData.activity?.lastPaymentTimestamp;

      expect(lastPaymentTimestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(lastPaymentTimestamp).toBeLessThanOrEqual(afterTimestamp);
    });
  });

  describe('deleteTransaction', () => {
    it('deletes a purchase transaction', async ({firestore}) => {
      // First create a purchase
      await chargePurchase(firestore, testAccountId, testItem);

      // Get the created transaction
      const transactions = await getDocs(
        query(
          collection(firestore, 'transactions'),
          where('account', '==', testAccountId),
          where('type', '==', 'purchase'),
        ),
      );
      const lastTransaction = transactions.docs[
        transactions.docs.length - 1
      ].data() as Transaction;

      const countBefore = transactions.size;

      // Delete the transaction
      await deleteTransaction(firestore, lastTransaction);

      // Verify it's deleted
      const transactionsAfter = await getDocs(
        query(
          collection(firestore, 'transactions'),
          where('account', '==', testAccountId),
          where('type', '==', 'purchase'),
        ),
      );

      expect(transactionsAfter.size).toBe(countBefore - 1);
    });

    it('reverses totalPurchased when deleting purchase', async ({
      firestore,
    }) => {
      const accountRef = doc(firestore, 'accounts', testAccountId);

      // First create a purchase
      await chargePurchase(firestore, testAccountId, testItem);

      const accountAfterPurchase = await getDoc(accountRef);
      const purchaseData = accountAfterPurchase.data() as {
        activity?: {totalPurchased?: number};
      };
      const totalPurchasedAfterPurchase =
        purchaseData.activity?.totalPurchased ?? 0;

      // Get the created transaction
      const transactions = await getDocs(
        query(
          collection(firestore, 'transactions'),
          where('account', '==', testAccountId),
          where('type', '==', 'purchase'),
        ),
      );
      const lastTransaction = transactions.docs[
        transactions.docs.length - 1
      ].data() as Transaction;

      // Delete the transaction
      await deleteTransaction(firestore, lastTransaction);

      // Verify totalPurchased is reversed
      const accountAfterDelete = await getDoc(accountRef);
      const deleteData = accountAfterDelete.data() as {
        activity?: {totalPurchased?: number};
      };
      const totalPurchasedAfterDelete =
        deleteData.activity?.totalPurchased ?? 0;

      expect(totalPurchasedAfterDelete).toBe(
        totalPurchasedAfterPurchase - testItem.price,
      );
    });

    it('deletes a payment transaction', async ({firestore}) => {
      // First create a payment
      await addPayment(firestore, testAccountId, 10);

      // Get the created transaction
      const transactions = await getDocs(
        query(
          collection(firestore, 'transactions'),
          where('account', '==', testAccountId),
          where('type', '==', 'payment'),
        ),
      );
      const lastTransaction = transactions.docs[
        transactions.docs.length - 1
      ].data() as Transaction;

      const countBefore = transactions.size;

      // Delete the transaction
      await deleteTransaction(firestore, lastTransaction);

      // Verify it's deleted
      const transactionsAfter = await getDocs(
        query(
          collection(firestore, 'transactions'),
          where('account', '==', testAccountId),
          where('type', '==', 'payment'),
        ),
      );

      expect(transactionsAfter.size).toBe(countBefore - 1);
    });

    it('reverses totalPaid when deleting payment', async ({firestore}) => {
      const accountRef = doc(firestore, 'accounts', testAccountId);

      // First create a payment
      const paymentAmount = 10;
      await addPayment(firestore, testAccountId, paymentAmount);

      const accountAfterPayment = await getDoc(accountRef);
      const paymentData = accountAfterPayment.data() as {
        activity?: {totalPaid?: number};
      };
      const totalPaidAfterPayment = paymentData.activity?.totalPaid ?? 0;

      // Get the created transaction
      const transactions = await getDocs(
        query(
          collection(firestore, 'transactions'),
          where('account', '==', testAccountId),
          where('type', '==', 'payment'),
        ),
      );
      const lastTransaction = transactions.docs[
        transactions.docs.length - 1
      ].data() as Transaction;

      // Delete the transaction
      await deleteTransaction(firestore, lastTransaction);

      // Verify totalPaid is reversed
      const accountAfterDelete = await getDoc(accountRef);
      const deleteData = accountAfterDelete.data() as {
        activity?: {totalPaid?: number};
      };
      const totalPaidAfterDelete = deleteData.activity?.totalPaid ?? 0;

      expect(totalPaidAfterDelete).toBe(totalPaidAfterPayment - paymentAmount);
    });
  });

  describe('loadAccountTransactions', () => {
    it('limits transactions to specified count', async ({firestore}) => {
      // Create 15 transactions
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(chargePurchase(firestore, testAccountId, testItem));
      }
      await Promise.all(promises);

      // Load with limit of 10
      const transactions = await loadAccountTransactions(
        firestore,
        testAccountId,
        10,
      );

      expect(transactions).toHaveLength(10);
    });

    it('returns all transactions when limit is higher than count', async ({
      firestore,
    }) => {
      // Create 3 transactions
      await chargePurchase(firestore, testAccountId, testItem);
      await chargePurchase(firestore, testAccountId, testItem);
      await addPayment(firestore, testAccountId, 10);

      // Load with limit of 100
      const transactions = await loadAccountTransactions(
        firestore,
        testAccountId,
        100,
      );

      expect(transactions.length).toBeLessThanOrEqual(100);
      expect(transactions.length).toBeGreaterThanOrEqual(3);
    });

    it('returns most recent transactions first', async ({firestore}) => {
      // Create transactions with delays to ensure different timestamps
      await chargePurchase(firestore, testAccountId, testItem);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await addPayment(firestore, testAccountId, 5);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await chargePurchase(firestore, testAccountId, testItem);

      const transactions = await loadAccountTransactions(
        firestore,
        testAccountId,
        100,
      );

      // Most recent transaction should be first
      expect(transactions[0].type).toBe('purchase');
      expect(transactions[1].type).toBe('payment');
      expect(transactions[2].type).toBe('purchase');
    });
  });
});
