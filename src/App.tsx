import {useAuth} from './hooks';
import {AccountGrid, Login} from './pages';
import {StoreContext, createStoreContextValue, ItemsProvider} from './contexts';
import {getFirestore} from 'firebase/firestore';
import {Center, Spinner} from '@chakra-ui/react';

export const App = () => {
  const {isLoggedIn, isAuthLoading} = useAuth();

  if (isAuthLoading) {
    return (
      <Center h={'100vh'}>
        <Spinner size={'xl'} />
      </Center>
    );
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  const firestore = getFirestore();
  const storeContextValue = createStoreContextValue(firestore);

  return (
    <ItemsProvider firestore={firestore}>
      <StoreContext.Provider value={storeContextValue}>
        <AccountGrid />
      </StoreContext.Provider>
    </ItemsProvider>
  );
};
