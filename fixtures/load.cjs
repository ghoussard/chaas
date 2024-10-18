#!/usr/bin/env node
const {readFileSync} = require('fs');
const {exit} = require('process');
const {initializeApp} = require('firebase/app');
const {
  getFirestore,
  connectFirestoreEmulator,
  setDoc,
  doc,
  collection,
} = require('firebase/firestore');

// @todo Use typescript and fixtures helpers in this file

function connectToFirestore() {
  const app = initializeApp({projectId: 'chaas-local'});
  const firestore = getFirestore(app);
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  return firestore;
}

async function loadAccounts(firestore) {
  const fileContent = readFileSync(`${__dirname}/data/accounts.json`);
  const accounts = JSON.parse(fileContent);

  const accountsCollection = collection(firestore, 'accounts');
  for (const customer of accounts) {
    const document = doc(accountsCollection, customer.id);
    await setDoc(document, customer);
  }
}

const firestore = connectToFirestore();
loadAccounts(firestore).then(() => exit(0));
