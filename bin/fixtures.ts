import {exit} from 'process';
import {getFirestore} from 'firebase/firestore';
import {createFirebaseApp, Dataset, Env, loadAccounts} from '@chaas/utils';

const app = createFirebaseApp(Env.DEV);
const firestore = getFirestore(app);

await loadAccounts(firestore, Dataset.DEV);

exit(0);
