import {memo} from 'react';
import {
  Image,
  Card,
  CardFooter,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import {AccountDrawer} from './AccountDrawer';

type AccountCardProps = {
  id: string;
  name: string;
  pictureUrl: string;
  totalPaid: number;
  totalPurchased: number;
};

const debtColor = (debt: number): string => (debt < 0 ? 'red' : 'green');

export const AccountCard = memo(function AccountCard({
  id,
  name,
  pictureUrl,
  totalPaid,
  totalPurchased,
}: AccountCardProps) {
  const {isOpen, onOpen, onClose} = useDisclosure();
  const debt = totalPaid - totalPurchased;

  return (
    <>
      <Card
        size={'sm'}
        cursor={'pointer'}
        onClick={onOpen}
        data-testid={'account-card'}
        borderRadius={'xl'}
        boxShadow={'md'}
        overflow={'hidden'}
        transition={'all 0.2s'}
        _hover={{
          transform: 'translateY(-4px)',
          boxShadow: 'xl',
        }}
      >
        <Image boxSize={300} objectFit={'cover'} src={pictureUrl} alt={name} />
        <CardFooter justifyContent={'space-between'} alignItems={'center'} py={4}>
          <Text fontSize={'lg'} fontWeight={'medium'} verticalAlign={'middle'}>
            {name}
          </Text>
          <Text fontSize={'xl'} fontWeight={'bold'} color={debtColor(debt)}>
            {debt >= 0 ? '+' : ''}{debt}€
          </Text>
        </CardFooter>
      </Card>
      <AccountDrawer
        isOpen={isOpen}
        onClose={onClose}
        accountId={id}
        name={name}
        totalPaid={totalPaid}
        totalPurchased={totalPurchased}
      />
    </>
  );
});
