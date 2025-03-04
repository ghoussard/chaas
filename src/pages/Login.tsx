import {useCallback, useState} from 'react';
import {
  Box,
  Button,
  FormControl,
  Image,
  FormLabel,
  Input,
  VStack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {useAuth} from '../hooks';
import logo from '../assets/logo.png';

export const Login = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [unableToLogIn, setUnableToLogIn] = useState(false);
  const {logIn, isLoggingIn} = useAuth();

  const tryToLogIn = useCallback(async () => {
    try {
      setUnableToLogIn(false);
      await logIn(login, password);
    } catch {
      setUnableToLogIn(true);
    }
  }, [login, password, logIn]);

  return (
    <VStack spacing={5} h={'100vh'} paddingTop={'20vh'} marginInline={'40vw'}>
      <Box boxSize={'sm'}>
        <Image src={logo} />
      </Box>
      <FormControl>
        <FormLabel>Login</FormLabel>
        <Input
          type="email"
          placeholder="michel@chaquip.com"
          value={login}
          onChange={(e) => {
            setLogin(e.target.value);
          }}
        />
      </FormControl>
      <FormControl>
        <FormLabel>Password</FormLabel>
        <Input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
        />
      </FormControl>
      <Button isLoading={isLoggingIn} onClick={() => void tryToLogIn()}>
        Log In
      </Button>
      {unableToLogIn && (
        <Alert status="error">
          <AlertIcon />
          Unable to log in! Please check your login or retry later Michel.
        </Alert>
      )}
    </VStack>
  );
};
