import {collection, doc, Firestore, setDoc} from 'firebase/firestore';
import {Account} from '../../models';

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
