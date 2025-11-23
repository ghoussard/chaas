import {
  VStack,
  Box,
  HStack,
  Text,
  Badge,
  Divider,
  Spinner,
  Center,
} from '@chakra-ui/react';
import {Transaction} from '../models';

export type TransactionListProps = {
  transactions: Transaction[] | null;
  isLoading: boolean;
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const TransactionList = ({
  transactions,
  isLoading,
}: TransactionListProps) => {
  if (isLoading) {
    return (
      <Center py={10}>
        <Spinner size={'xl'} />
      </Center>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Center py={10}>
        <Text color={'gray.500'} fontSize={'lg'}>
          No transactions yet
        </Text>
      </Center>
    );
  }

  return (
    <VStack spacing={3} align={'stretch'}>
      {transactions.map((transaction) => (
        <Box key={transaction.id}>
          <HStack justify={'space-between'} align={'start'}>
            <VStack align={'start'} spacing={1} flex={1}>
              <HStack>
                <Badge
                  colorScheme={
                    transaction.type === 'payment' ? 'green' : 'blue'
                  }
                  fontSize={'sm'}
                >
                  {transaction.type === 'payment' ? 'Payment' : 'Purchase'}
                </Badge>
                <Text fontSize={'sm'} color={'gray.500'}>
                  {formatDate(transaction.timestamp)}
                </Text>
              </HStack>
              {transaction.type === 'purchase' && (
                <Text fontSize={'md'} fontWeight={'medium'}>
                  {transaction.item.name}
                </Text>
              )}
            </VStack>
            <Text
              fontSize={'lg'}
              fontWeight={'bold'}
              color={transaction.type === 'payment' ? 'green.500' : 'blue.500'}
            >
              {transaction.type === 'payment' ? '+' : '-'}
              {transaction.type === 'payment'
                ? transaction.amount
                : transaction.item.price}
              €
            </Text>
          </HStack>
          <Divider mt={3} />
        </Box>
      ))}
    </VStack>
  );
};
