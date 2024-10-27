import {collection, doc, Firestore, setDoc} from 'firebase/firestore';
import {Account} from '../../models';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {FirebaseError} from 'firebase/app';

export enum Dataset {
  DEV = 'dev',
  TEST = 'test',
}

const getData = async <T>(name: string, dataset: Dataset): Promise<T> => {
  const {default: data} = (await import(
    `./datasets/${dataset}/${name}.json`
  )) as {default: T};
  return data;
};

export const loadAccounts = async (firestore: Firestore, dataset: Dataset) => {
  const accounts = await getData<Account[]>('accounts', dataset);

  const accountsCollection = collection(firestore, 'accounts');
  for (const customer of accounts) {
    const document = doc(accountsCollection, customer.id);
    await setDoc(document, customer);
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
