import {collection, doc, Firestore, setDoc} from 'firebase/firestore';
import {Account} from '@chaas/common';

export enum Dataset {
  DEV = 'dev',
  TEST = 'test',
}

const getData = async <T>(name: string, dataset: Dataset) => {
  const {default: data} = (await import(
    `./datasets/${dataset}/${name}.json`
  )) as {default: T};
  return data;
};

export const loadAccounts = async (firestore: Firestore, dataset: Dataset) => {
  const accounts = await getData<Account[]>('accounts', dataset);

  const accountsCollection = collection(firestore, 'accounts');
  for (const account of accounts) {
    const document = doc(accountsCollection, account.id);
    await setDoc(document, account);
  }
};
