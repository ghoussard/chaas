import {exit} from 'process';
import {getFirestore} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';
import {createFirebaseApp, Env} from '../src/utils/firebase';
import {createUser, Dataset, loadAccounts} from '../src/utils/fixtures';

const app = createFirebaseApp(Env.DEV);
const firestore = getFirestore(app);
const auth = getAuth(app);

await createUser(auth, 'admin@example.com', 'admin123');
await loadAccounts(firestore, Dataset.DEV);

exit(0);
