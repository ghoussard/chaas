import {useAuth} from './hooks';
import {AccountGrid, Login} from './pages';

export const App = () => {
  const {isLoggedIn} = useAuth();

  return isLoggedIn ? <AccountGrid /> : <Login />;
};
