import {memo} from 'react';
import {
  Image,
  Card,
  CardFooter,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  useDisclosure,
} from '@chakra-ui/react';
import {AccountDrawer} from './AccountDrawer';

type AccountCardProps = {
  name: string;
  pictureUrl: string;
  totalPaid: number;
  totalPurchased: number;
};

const debtColor = (debt: number): string => (debt < 0 ? 'red' : 'green');

export const AccountCard = memo(function Hello({
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
      >
        <Image boxSize={300} objectFit={'cover'} src={pictureUrl} alt={name} />
        <CardFooter justifyContent={'space-between'} alignItems={'center'}>
          <Text fontSize={'xl'} verticalAlign={'middle'}>
            {name}
          </Text>
          <Stat textAlign={'right'}>
            <StatLabel>Debt</StatLabel>
            <StatNumber color={debtColor(debt)}>{debt}€</StatNumber>
          </Stat>
        </CardFooter>
      </Card>
      <AccountDrawer isOpen={isOpen} onClose={onClose} name={name} />
    </>
  );
});
