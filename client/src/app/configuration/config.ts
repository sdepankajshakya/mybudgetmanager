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
    { key: 1, value: 'January' },
    { key: 2, value: 'February' },
    { key: 3, value: 'March' },
    { key: 4, value: 'April' },
    { key: 5, value: 'May' },
    { key: 6, value: 'June' },
    { key: 7, value: 'July' },
    { key: 8, value: 'August' },
    { key: 9, value: 'September' },
    { key: 10, value: 'October' },
    { key: 11, value: 'November' },
    { key: 12, value: 'December' },
  ],
};
