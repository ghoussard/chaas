type AccountActivity = {
  totalPurchased: number;
  totalPaid: number;
  lastPurchaseTimestamp: number;
  lastPaymentTimestamp: number;
};

export type Account = {
  id: string;
  slack: {
    id: string;
    name: string;
    username: string;
    pictureUrl: string;
  };
  activity: AccountActivity;
};
