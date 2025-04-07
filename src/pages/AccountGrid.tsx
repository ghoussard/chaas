import {useDeferredValue, useState, useRef} from 'react';
import {
  Center,
  Spinner,
  VStack,
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
      <VStack spacing={5}>
        <HStack
          w={'100%'}
          paddingInline={'1vw'}
          spacing={5}
          alignItems={'center'}
        >
          <AccountSearchInput
            value={searchValue}
            onChange={(newValue) => {
              setSearchValue(newValue);
            }}
            ref={focusableElementRef}
          />
          <Button onClick={() => void logOut()}>Log out</Button>
        </HStack>
        <SimpleGrid columns={6} spacing={5}>
          {accounts.map(({id, slack: {name, pictureUrl}, activity}) => (
            <AccountCard
              key={id}
              name={name}
              pictureUrl={pictureUrl}
              totalPaid={activity.totalPaid}
              totalPurchased={activity.totalPurchased}
            />
          ))}
        </SimpleGrid>
      </VStack>
      <HelpModal />
    </FocusableElementRefContext.Provider>
  );
};
