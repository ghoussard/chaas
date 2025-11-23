import {
  Card,
  CardBody,
  Image,
  Stack,
  Heading,
  Text,
  HStack,
  IconButton,
  Badge,
  VStack,
} from '@chakra-ui/react';
import {AddIcon, MinusIcon} from '@chakra-ui/icons';
import {Item} from '../models';

export type DrinkCardProps = {
  item: Item;
  quantity: number;
  onQuickCharge: (item: Item) => void;
  onIncrement: (item: Item) => void;
  onDecrement: (item: Item) => void;
};

export const DrinkCard = ({
  item,
  quantity,
  onQuickCharge,
  onIncrement,
  onDecrement,
}: DrinkCardProps) => {
  return (
    <Card
      maxW={'sm'}
      position={'relative'}
      borderRadius={'xl'}
      boxShadow={'md'}
      overflow={'hidden'}
      transition={'all 0.2s'}
    >
      {quantity > 0 && (
        <Badge
          position={'absolute'}
          top={2}
          right={2}
          colorScheme={'blue'}
          fontSize={'md'}
          borderRadius={'full'}
          px={2}
          py={1}
          zIndex={1}
        >
          {quantity}
        </Badge>
      )}
      <CardBody p={3}>
        <Image
          src={`https://placehold.co/300x200?text=${encodeURIComponent(item.name)}`}
          alt={item.name}
          borderRadius={'lg'}
          cursor={'pointer'}
          onClick={() => onQuickCharge(item)}
          h={'120px'}
          w={'full'}
          objectFit={'cover'}
          transition={'all 0.2s'}
          _hover={{opacity: 0.8, transform: 'scale(1.02)'}}
        />
        <Stack mt={3} spacing={2}>
          <VStack spacing={0} align={'start'}>
            <Heading size={'sm'}>{item.name}</Heading>
            <Text color={'blue.600'} fontSize={'lg'} fontWeight={'bold'}>
              {item.price}€
            </Text>
          </VStack>
          <HStack justify={'center'} spacing={3}>
            <IconButton
              aria-label={'Decrease quantity'}
              icon={<MinusIcon />}
              onClick={() => onDecrement(item)}
              isDisabled={quantity === 0}
              size={'md'}
              variant={'ghost'}
              borderRadius={'full'}
            />
            <Text
              fontSize={'md'}
              fontWeight={'bold'}
              minW={'30px'}
              textAlign={'center'}
            >
              {quantity}
            </Text>
            <IconButton
              aria-label={'Increase quantity'}
              icon={<AddIcon />}
              onClick={() => onIncrement(item)}
              size={'md'}
              variant={'ghost'}
              borderRadius={'full'}
            />
          </HStack>
        </Stack>
      </CardBody>
    </Card>
  );
};
