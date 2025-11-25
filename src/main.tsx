import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ChakraProvider} from '@chakra-ui/react';
import {AuthContext} from './contexts';
import {createFirebaseApp, Env} from './utils/firebase';
import {App} from './App';
import {getAuth} from 'firebase/auth';

const root = document.getElementById('root');

if (root === null) {
  throw new Error('Root element not found');
}

const env = import.meta.env.PROD ? Env.PROD : Env.DEV;
const app = createFirebaseApp(env);
const auth = getAuth(app);

createRoot(root).render(
  <StrictMode>
    <ChakraProvider>
      <AuthContext.Provider value={auth}>
        <App />
      </AuthContext.Provider>
    </ChakraProvider>
  </StrictMode>,
);
