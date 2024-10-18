type AccountActivity = {
  totalPursached: number;
  totalPaid: number;
  lastPursacheTimestamp: number;
  lastPaymentTimestamp: number;
};

export type Account = {
  id: string;
  name: string;
  username: string;
  pictureUrl: string;
  activity: AccountActivity;
};
