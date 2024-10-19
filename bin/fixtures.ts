import {exit} from 'process';
import {getFirestore} from 'firebase/firestore';
import {createFirebaseApp, Env} from '../src/firebase';
import {Dataset, loadAccounts} from '../src/fixtures';

const app = createFirebaseApp(Env.DEV);
const firestore = getFirestore(app);

await loadAccounts(firestore, Dataset.DEV);

exit(0);
