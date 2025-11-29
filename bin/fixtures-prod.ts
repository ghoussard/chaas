import {exit} from 'process';
import {getFirestore} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';
import {createFirebaseApp, Env} from '../src/utils/firebase';
import {
  createUser,
  Dataset,
  loadAccounts,
  loadItems,
  loadTransactions,
} from '../src/utils/fixtures';

const app = createFirebaseApp(Env.DEV);
const firestore = getFirestore(app);
const auth = getAuth(app);

await createUser(auth, 'michel@chaquip.com', 'michel');
await loadAccounts(firestore, Dataset.PROD);
await loadItems(firestore, Dataset.PROD);
await loadTransactions(firestore, Dataset.PROD);

exit(0);
