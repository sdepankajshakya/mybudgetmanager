/**
 * to add the entries run this script with the db name, for eg
 * for local : mongo localhost:27017/budget-manager ./dbScripts/populatePaymentModes.js
 * for cloud: mongo mongodb+srv://admin:fnurq8EzMN8JH7sV@cluster0.tpeau.mongodb.net/budget-manager ./dbScripts/populatePaymentModes.js
 */

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
