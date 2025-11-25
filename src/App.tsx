import {useAuth} from './hooks';
import {AccountGrid, Login} from './pages';
import {StoreContext, createStoreContextValue, ItemsProvider} from './contexts';
import {getFirestore} from 'firebase/firestore';

export const App = () => {
  const {isLoggedIn} = useAuth();

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
