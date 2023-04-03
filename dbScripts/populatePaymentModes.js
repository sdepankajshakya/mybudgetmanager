db.paymentmodes.insertMany([
  {
    name: "Cash",
    type: 1,
    icon: "assets/images/paymentModes/cash.png",
  },
  {
    name: "Mobile Wallet",
    type: 2,
    icon: "assets/images/paymentModes/cashless.png",
  },
  {
    name: "Credit Card",
    type: 3,
    icon: "assets/images/paymentModes/card3.png",
  },
  {
    name: "Debit Card",
    type: 4,
    icon: "assets/images/paymentModes/card2.png",
  },
  {
    name: "Bank Account",
    type: 5,
    icon: "assets/images/paymentModes/bank.png",
  },
]);
