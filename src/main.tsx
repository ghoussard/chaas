import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ChakraProvider} from '@chakra-ui/react';
import {StoreContext, createStoreContextValue} from './contexts';
import {createFirebaseApp, Env} from './firebase';
import {App} from './App';
import {getFirestore} from 'firebase/firestore';

const root = document.getElementById('root');

if (root === null) {
  throw new Error('Root element not found');
}

const env = import.meta.env.PROD ? Env.PROD : Env.DEV;
const app = createFirebaseApp(env);
const firestore = getFirestore(app);
const storeContextValue = createStoreContextValue(firestore);

createRoot(root).render(
  <StrictMode>
    <ChakraProvider>
      <StoreContext.Provider value={storeContextValue}>
        <App />
      </StoreContext.Provider>
    </ChakraProvider>
  </StrictMode>,
);
