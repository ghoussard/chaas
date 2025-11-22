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
    <Card maxW={'sm'} position={'relative'}>
      {quantity > 0 && (
        <Badge
          position={'absolute'}
          top={2}
          right={2}
          colorScheme={'blue'}
          fontSize={'lg'}
          borderRadius={'full'}
          px={3}
          py={1}
          zIndex={1}
        >
          {quantity}
        </Badge>
      )}
      <CardBody>
        <Image
          src={`https://placehold.co/300x200?text=${encodeURIComponent(item.name)}`}
          alt={item.name}
          borderRadius={'lg'}
          cursor={'pointer'}
          onClick={() => onQuickCharge(item)}
          _hover={{opacity: 0.8}}
        />
        <Stack mt={'6'} spacing={'3'}>
          <VStack spacing={1} align={'start'}>
            <Heading size={'md'}>{item.name}</Heading>
            <Text color={'blue.600'} fontSize={'2xl'} fontWeight={'bold'}>
              {item.price}€
            </Text>
          </VStack>
          <HStack justify={'center'} spacing={4}>
            <IconButton
              aria-label={'Decrease quantity'}
              icon={<MinusIcon />}
              onClick={() => onDecrement(item)}
              isDisabled={quantity === 0}
              size={'lg'}
            />
            <Text fontSize={'xl'} fontWeight={'bold'} minW={'40px'} textAlign={'center'}>
              {quantity}
            </Text>
            <IconButton
              aria-label={'Increase quantity'}
              icon={<AddIcon />}
              onClick={() => onIncrement(item)}
              size={'lg'}
            />
          </HStack>
        </Stack>
      </CardBody>
    </Card>
  );
};
