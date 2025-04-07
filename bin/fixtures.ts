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
  updateAccountActivity,
} from '../src/utils/fixtures';

const app = createFirebaseApp(Env.DEV);
const firestore = getFirestore(app);
const auth = getAuth(app);

await createUser(auth, 'michel@chaquip.com', 'michel');
await loadAccounts(firestore, Dataset.DEV);
await loadItems(firestore, Dataset.DEV);
await loadTransactions(firestore, Dataset.DEV);
await updateAccountActivity(firestore);

exit(0);
