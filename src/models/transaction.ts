import {Item} from './item';

type Purchase = {
  id: string;
  type: 'purchase';
  item: Item;
  account: string;
  timestamp: number;
};

type Payment = {
  id: string;
  type: 'payment';
  account: string;
  amount: number;
  timestamp: number;
};

export type Transaction = Purchase | Payment;
