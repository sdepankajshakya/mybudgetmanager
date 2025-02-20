import { environment } from 'src/environments/environment';

export let config = {
  apiBaseUrl: environment.apiBaseUrl,

  urls: {
    signup: '/user/signup',
    login: '/user/login',
    onGoogleSignIn: '/user/onGoogleSignIn',
    getTransactionsDateRange: '/getTransactionsDateRange',
    getTransactions: '/getTransactions',
    getFilteredTransactions: '/getFilteredTransactions',
    newTransaction: '/newtransaction',
    deleteTransaction: '/deletetransaction',
    deleteAllTransactions: '/deletealltransactions',
    getSettings: '/getsettings',
    getCurrencies: '/getcurrencies',
    updateSettings: '/updatesettings',
    getCategories: '/getcategories',
    uploadSpreadsheet: '/uploadSpreadsheet',
    downloadSpreadsheet: '/downloadSpreadsheet',
    addCategory: '/addcategory',
    deleteCategory: '/deletecategory',
    contactUs: '/user/contactus',
    getPaymentModes: '/getPaymentModes',
    addPaymentMode: '/addPaymentMode',
    deletePaymentMode: '/deletePaymentMode'
  },

  months: [
    { key: 1, value: 'Jan' },
    { key: 2, value: 'Feb' },
    { key: 3, value: 'Mar' },
    { key: 4, value: 'April' },
    { key: 5, value: 'May' },
    { key: 6, value: 'June' },
    { key: 7, value: 'July' },
    { key: 8, value: 'Aug' },
    { key: 9, value: 'Sept' },
    { key: 10, value: 'Oct' },
    { key: 11, value: 'Nov' },
    { key: 12, value: 'Dec' },
  ],
};
