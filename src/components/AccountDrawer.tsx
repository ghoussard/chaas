import {useState, useCallback, useEffect} from 'react';
import {
  Drawer,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Heading,
  VStack,
  Text,
  SimpleGrid,
  Button,
  useToast,
  Spinner,
  Center,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightAddon,
} from '@chakra-ui/react';
import {useFocusableElementRef, useItems} from '../hooks';
import {DrinkCard, TransactionList} from './';
import {Item, Transaction} from '../models';
import {chargePurchase, chargePurchases, addPayment} from '../services';
import {loadAccountTransactions} from '../store';
import {getFirestore} from 'firebase/firestore';

export type AccountDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  name: string;
  totalPaid: number;
  totalPurchased: number;
};

const debtColor = (debt: number): string => (debt < 0 ? 'red' : 'green');

export const AccountDrawer = ({
  isOpen,
  onClose,
  accountId,
  name,
  totalPaid,
  totalPurchased,
}: AccountDrawerProps) => {
  const focusableElementRef = useFocusableElementRef();
  const balance = totalPaid - totalPurchased;
  const items = useItems();
  const toast = useToast();
  const firestore = getFirestore();

  const [quantities, setQuantities] = useState<Map<string, number>>(new Map());
  const [isCharging, setIsCharging] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  const resetQuantities = useCallback(() => {
    setQuantities(new Map());
  }, []);

  useEffect(() => {
    if (isOpen) {
      const debt = totalPurchased - totalPaid;
      if (debt > 0) {
        setPaymentAmount(debt.toString());
      } else {
        setPaymentAmount('');
      }

      // Load transactions
      setIsLoadingTransactions(true);
      loadAccountTransactions(firestore, accountId)
        .then((loadedTransactions) => {
          setTransactions(loadedTransactions);
        })
        .catch((error) => {
          console.error('Error loading transactions:', error);
          toast({
            title: 'Error loading transactions',
            description:
              error instanceof Error ? error.message : 'Unknown error',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        })
        .finally(() => {
          setIsLoadingTransactions(false);
        });
    }
  }, [isOpen, totalPaid, totalPurchased, firestore, accountId, toast]);

  const handleQuickCharge = useCallback(
    async (item: Item) => {
      setIsCharging(true);
      try {
        await chargePurchase(firestore, accountId, item);
        onClose();
      } catch (error) {
        toast({
          title: 'Error charging drink',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsCharging(false);
      }
    },
    [firestore, accountId, onClose, toast],
  );

  const handleIncrement = useCallback((item: Item) => {
    setQuantities((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(item.id) || 0;
      newMap.set(item.id, current + 1);
      return newMap;
    });
  }, []);

  const handleDecrement = useCallback((item: Item) => {
    setQuantities((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(item.id) || 0;
      if (current > 0) {
        newMap.set(item.id, current - 1);
      }
      return newMap;
    });
  }, []);

  const handleBatchCharge = useCallback(async () => {
    const itemsToCharge = items
      .map((item) => ({
        item,
        quantity: quantities.get(item.id) || 0,
      }))
      .filter(({quantity}) => quantity > 0);

    if (itemsToCharge.length === 0) return;

    setIsCharging(true);
    try {
      await chargePurchases(firestore, accountId, itemsToCharge);
      resetQuantities();
      onClose();
    } catch (error) {
      toast({
        title: 'Error charging drinks',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCharging(false);
    }
  }, [items, quantities, firestore, accountId, resetQuantities, onClose, toast]);

  const totalQuantity = Array.from(quantities.values()).reduce(
    (sum, qty) => sum + qty,
    0,
  );

  const handleAddPayment = useCallback(async () => {
    const amount = parseFloat(paymentAmount);

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Payment amount must be greater than 0',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsProcessingPayment(true);
    try {
      await addPayment(firestore, accountId, amount);
      setPaymentAmount('');
      onClose();
    } catch (error) {
      toast({
        title: 'Error adding payment',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessingPayment(false);
    }
  }, [paymentAmount, firestore, accountId, onClose, toast]);

  const paymentAmountValue = parseFloat(paymentAmount) || 0;
  const newBalance = totalPaid + paymentAmountValue - totalPurchased;

  return (
    <Drawer
      isOpen={isOpen}
      placement={'right'}
      onClose={onClose}
      size={'full'}
      finalFocusRef={focusableElementRef}
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          <VStack align={'start'} spacing={2}>
            <Heading size={'lg'}>{name}</Heading>
            <Text fontSize={'xl'} color={debtColor(balance)}>
              Balance: {balance >= 0 ? '+' : ''}
              {balance}€
            </Text>
          </VStack>
        </DrawerHeader>

        <DrawerBody>
          <Tabs defaultIndex={0}>
            <TabList>
              <Tab>Charge Drinks</Tab>
              <Tab>Add Payment</Tab>
              <Tab>Transactions</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                {isCharging ? (
                  <Center py={10}>
                    <Spinner size={'xl'} />
                  </Center>
                ) : (
                  <VStack spacing={6}>
                    <SimpleGrid columns={3} spacing={5}>
                      {items.map((item) => (
                        <DrinkCard
                          key={item.id}
                          item={item}
                          quantity={quantities.get(item.id) || 0}
                          onQuickCharge={handleQuickCharge}
                          onIncrement={handleIncrement}
                          onDecrement={handleDecrement}
                        />
                      ))}
                    </SimpleGrid>
                    <Button
                      colorScheme={'blue'}
                      size={'lg'}
                      width={'full'}
                      onClick={handleBatchCharge}
                      isDisabled={totalQuantity === 0}
                    >
                      Charge ({totalQuantity} item{totalQuantity !== 1 ? 's' : ''})
                    </Button>
                  </VStack>
                )}
              </TabPanel>
              <TabPanel>
                {isProcessingPayment ? (
                  <Center py={10}>
                    <Spinner size={'xl'} />
                  </Center>
                ) : (
                  <VStack spacing={6} align={'stretch'}>
                    {totalPurchased > totalPaid && (
                      <Text fontSize={'lg'}>
                        Current debt:{' '}
                        <Text as={'span'} fontWeight={'bold'} color={'red'}>
                          {totalPurchased - totalPaid}€
                        </Text>
                      </Text>
                    )}

                    <FormControl>
                      <FormLabel fontSize={'lg'}>Payment amount:</FormLabel>
                      <InputGroup size={'lg'}>
                        <Input
                          type={'number'}
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder={'0'}
                          min={0}
                          step={0.01}
                        />
                        <InputRightAddon>€</InputRightAddon>
                      </InputGroup>
                    </FormControl>

                    {paymentAmountValue > 0 && (
                      <Text fontSize={'lg'}>
                        New balance:{' '}
                        <Text
                          as={'span'}
                          fontWeight={'bold'}
                          color={debtColor(newBalance)}
                        >
                          {newBalance >= 0 ? '+' : ''}
                          {newBalance}€
                        </Text>
                      </Text>
                    )}

                    <Button
                      colorScheme={'green'}
                      size={'lg'}
                      width={'full'}
                      onClick={handleAddPayment}
                      isDisabled={
                        !paymentAmount || paymentAmountValue <= 0
                      }
                    >
                      Add Payment
                    </Button>
                  </VStack>
                )}
              </TabPanel>
              <TabPanel>
                <TransactionList
                  transactions={transactions}
                  isLoading={isLoadingTransactions}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default AccountDrawer;
