import {useDeferredValue, useState, useRef} from 'react';
import {Center, Spinner, VStack, SimpleGrid} from '@chakra-ui/react';
import {AccountCard, AccountSearchInput, HelpModal} from '../components';
import {useAccounts} from '../hooks';
import {FocusableElement} from '../models';
import {FocusableElementRefContext} from '../contexts';

export const AccountGrid = () => {
  const [searchValue, setSearchValue] = useState('');
  const deferredSearchValue = useDeferredValue(searchValue);
  const accounts = useAccounts(deferredSearchValue);
  const focusableElementRef = useRef<FocusableElement>(null);

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
        <AccountSearchInput
          value={searchValue}
          onChange={(newValue) => {
            setSearchValue(newValue);
          }}
          ref={focusableElementRef}
        />
        <SimpleGrid columns={6} spacing={5}>
          {accounts.map(({id, name, pictureUrl, activity}) => (
            <AccountCard
              key={id}
              name={name}
              pictureUrl={pictureUrl}
              totalPaid={activity.totalPaid}
              totalPurchased={activity.totalPursached}
            />
          ))}
        </SimpleGrid>
      </VStack>
      <HelpModal />
    </FocusableElementRefContext.Provider>
  );
};
