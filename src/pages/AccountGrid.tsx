import {useDeferredValue, useState, useRef} from 'react';
import {
  Box,
  Center,
  Spinner,
  SimpleGrid,
  Button,
  HStack,
} from '@chakra-ui/react';
import {AccountCard, AccountSearchInput, HelpModal} from '../components';
import {useAccounts, useAuth} from '../hooks';
import {FocusableElement} from '../models';
import {FocusableElementRefContext} from '../contexts';

export const AccountGrid = () => {
  const [searchValue, setSearchValue] = useState('');
  const deferredSearchValue = useDeferredValue(searchValue);
  const accounts = useAccounts(deferredSearchValue);
  const focusableElementRef = useRef<FocusableElement>(null);
  const {logOut} = useAuth();

  if (accounts === null) {
    return (
      <Center h={'100vh'}>
        <Spinner size={'xl'} />
      </Center>
    );
  }

  return (
    <FocusableElementRefContext.Provider value={focusableElementRef}>
      <Box minH={'100vh'} bg={'gray.50'}>
        <Box
          as={'header'}
          bg={'white'}
          borderBottom={'1px solid'}
          borderColor={'gray.200'}
          boxShadow={'sm'}
          px={8}
          py={4}
          position={'sticky'}
          top={0}
          zIndex={10}
        >
          <HStack spacing={5} justify={'space-between'}>
            <AccountSearchInput
              value={searchValue}
              onChange={(newValue) => {
                setSearchValue(newValue);
              }}
              ref={focusableElementRef}
            />
            <Button onClick={() => void logOut()} variant={'ghost'} size={'md'}>
              Log out
            </Button>
          </HStack>
        </Box>
        <Box px={8} py={8}>
          <SimpleGrid columns={{base: 2, md: 3, lg: 4, xl: 5}} spacing={8}>
            {accounts.map(({id, slack: {name, pictureUrl}, activity}) => (
              <AccountCard
                key={id}
                id={id}
                name={name}
                pictureUrl={pictureUrl}
                totalPaid={activity.totalPaid}
                totalPurchased={activity.totalPurchased}
              />
            ))}
          </SimpleGrid>
        </Box>
      </Box>
      <HelpModal />
    </FocusableElementRefContext.Provider>
  );
};
