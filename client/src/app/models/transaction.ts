export interface Transaction {
  _id: string;
  category: {
    name: string;
    type: string;
  };
  date: Date;
  displayDate: any;
  amount: number;
  paymentMode: number;
  displayAmount: string;
  note: string;
}
