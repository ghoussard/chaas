import {
  VStack,
  Box,
  HStack,
  Text,
  Badge,
  Spinner,
  Center,
  IconButton,
} from '@chakra-ui/react';
import {DeleteIcon} from '@chakra-ui/icons';
import {Transaction} from '../models';

export type TransactionListProps = {
  transactions: Transaction[] | null;
  isLoading: boolean;
  onDelete?: (transaction: Transaction) => void;
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
  onDelete,
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
    <VStack spacing={4} align={'stretch'}>
      {transactions.map((transaction) => (
        <Box
          key={transaction.id}
          p={4}
          bg={'white'}
          borderRadius={'lg'}
          boxShadow={'sm'}
          transition={'all 0.2s'}
          _hover={{
            boxShadow: 'md',
          }}
        >
          <HStack justify={'space-between'} align={'start'}>
            <VStack align={'start'} spacing={1} flex={1}>
              <HStack>
                <Badge
                  colorScheme={
                    transaction.type === 'payment' ? 'green' : 'blue'
                  }
                  fontSize={'sm'}
                  borderRadius={'md'}
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
            <HStack spacing={3}>
              <Text
                fontSize={'lg'}
                fontWeight={'bold'}
                color={transaction.type === 'payment' ? 'green.600' : 'blue.600'}
              >
                {transaction.type === 'payment' ? '+' : '-'}
                {transaction.type === 'payment'
                  ? transaction.amount
                  : transaction.item.price}
                €
              </Text>
              {onDelete && (
                <IconButton
                  aria-label={'Delete transaction'}
                  icon={<DeleteIcon />}
                  size={'sm'}
                  colorScheme={'red'}
                  variant={'ghost'}
                  onClick={() => onDelete(transaction)}
                  borderRadius={'md'}
                />
              )}
            </HStack>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
};
