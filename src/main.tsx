import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ChakraProvider} from '@chakra-ui/react';
import {StoreContext, createStoreContextValue, AuthContext} from './contexts';
import {createFirebaseApp, Env} from './utils/firebase';
import {App} from './App';
import {getFirestore} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';

const root = document.getElementById('root');

if (root === null) {
  throw new Error('Root element not found');
}

const env = import.meta.env.PROD ? Env.PROD : Env.DEV;
const app = createFirebaseApp(env);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storeContextValue = createStoreContextValue(firestore);

createRoot(root).render(
  <StrictMode>
    <ChakraProvider>
      <AuthContext.Provider value={auth}>
        <StoreContext.Provider value={storeContextValue}>
          <App />
        </StoreContext.Provider>
      </AuthContext.Provider>
    </ChakraProvider>
  </StrictMode>,
);
