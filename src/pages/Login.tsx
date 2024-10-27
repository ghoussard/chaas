import {useAuth} from '../hooks';

export const Login = () => {
  const {logIn} = useAuth();

  // @todo Implement component

  return <button onClick={() => void logIn('admin123')}>Login</button>;
};
