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
import logo from '../assets/chaquip_logo.png';

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
    <Box
      h={'100vh'}
      bg={'gray.50'}
      display={'flex'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      <Box
        bg={'white'}
        p={10}
        borderRadius={'16px'}
        boxShadow={'0 4px 20px rgba(0, 0, 0, 0.08)'}
        w={'full'}
        maxW={'450px'}
        mx={4}
      >
        <VStack spacing={6}>
          <Box w={'200px'}>
            <Image src={logo} />
          </Box>
          <Box textAlign={'center'} w={'full'}>
            <FormLabel fontSize={'2xl'} fontWeight={'semibold'} mb={0}>
              Welcome to ChaasS
            </FormLabel>
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
              size={'lg'}
              bg={'gray.50'}
              border={'1px solid'}
              borderColor={'transparent'}
              _focus={{
                borderColor: 'blue.400',
                boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
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
              size={'lg'}
              bg={'gray.50'}
              border={'1px solid'}
              borderColor={'transparent'}
              _focus={{
                borderColor: 'blue.400',
                boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
              }}
            />
          </FormControl>
          <Button
            isLoading={isLoggingIn}
            onClick={() => void tryToLogIn()}
            size={'lg'}
            w={'full'}
            colorScheme={'blue'}
            transition={'all 0.2s'}
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: 'lg',
            }}
          >
            Log In
          </Button>
          {unableToLogIn && (
            <Alert status="error" borderRadius={'lg'}>
              <AlertIcon />
              Unable to log in! Please check your login or retry later Michel.
            </Alert>
          )}
        </VStack>
      </Box>
    </Box>
  );
};
