import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';

import { config } from 'src/app/configuration/config';
import { MessageService } from 'src/app/services/message.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { AddTransactionComponent } from './add-transaction/add-transaction.component';
import { Transaction } from 'src/app/models/Transaction';

import * as Highcharts from 'highcharts';

import HC_exporting from 'highcharts/modules/exporting';

import { MatDialog } from '@angular/material/dialog';
import { SharedService } from 'src/app/services/shared.service';
import { ThemePalette } from '@angular/material/core';
import { SettingsService } from 'src/app/services/settings.service';
import { ToastrService } from 'ngx-toastr';
import { Category } from 'src/app/models/Category';
import { fade } from 'src/app/shared/animations';
import { formatNumber } from '@angular/common';
@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  animations: [fade],
})
export class OverviewComponent implements OnInit {
  messageSubscription: Subscription;
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  currency: any;
  userLocale: string = '';
  Highcharts = Highcharts;
  expenseDistOptions: any;
  totalSavingOptions: any;
  currentUser: any;
  transactionMonths: any[] = [];
  transactionYears: number[] = [];
  selectedMonth: number = 0;
  selectedYear: number = 0;
  search: string = '';
  calendarOptions: any;
  isLoading: boolean = false;
  color: ThemePalette = 'accent';
  categoryCount: any = {};
  private transaction: Transaction = {
    _id: null as any,
    category: {
      name: '',
      type: '',
    },
    date: new Date(),
    displayDate: {},
    amount: null as any,
    displayAmount: '',
    note: '',
  };

  @ViewChild('IncomeExpenseSummaryContainer', { static: false })
  IncomeExpenseSummaryContainer: ElementRef<HTMLInputElement> = {} as ElementRef;
  @ViewChild('TotalSavingsContainer', { static: false })
  TotalSavingsContainer: ElementRef<HTMLInputElement> = {} as ElementRef;

  constructor(
    private transactionService: TransactionService,
    public dialog: MatDialog,
    private messageService: MessageService,
    private sharedService: SharedService,
    private settingsService: SettingsService,
    private toastr: ToastrService
  ) {
    // set default currency
    this.currency = {
      code: '',
      decimal_digits: 0,
      name: '',
      symbol: '',
    };
    this.messageSubscription = this.messageService
      .getMessage()
      .subscribe((message) => {
        if (
          message.text === 'transaction deleted' ||
          message.text === 'transaction saved'
        ) {
          this.getTransactions();
        }
      });
  }

  ngOnInit(): void {
    this.getCategories();
    this.getTransactions();

    const userLocale =
      navigator.languages && navigator.languages.length
        ? navigator.languages[0]
        : navigator.language;
    this.sharedService.setItemToLocalStorage('userLocale', userLocale);
    this.userLocale =
      this.sharedService.getItemFromLocalStorage('userLocale') || 'en-IN';

    let settings = this.sharedService.getItemFromLocalStorage('settings');
    if (settings && settings.currency) {
      this.currency = settings.currency;
    }

    this.currentUser =
      this.sharedService.getItemFromLocalStorage('current_user');

    this.selectedMonth = this.sharedService.now.month;
    this.selectedYear = this.sharedService.now.year;
  }

  clearFilter() {
    this.selectedMonth = this.selectedYear = 0;
    this.filterByDate();
  }

  openAddTransactionModal(dateSelectedFromCalendar: Date = new Date()) {
    this.transaction.date = dateSelectedFromCalendar;
    this.dialog.open(AddTransactionComponent, {
      width: '550px',
      data: this.transaction,
    });
  }

  setDate(transactionDate: any) {
    let transDate = {
      day: '',
      month: '',
      weekday: '',
      year: '',
    };
    let date = new Date(transactionDate);

    transDate.day = date.toLocaleString('default', {
      day: 'numeric',
    });
    transDate.month = date.toLocaleString('default', {
      month: 'short',
    });
    transDate.weekday = date.toLocaleString('default', {
      weekday: 'short',
    });
    transDate.year = date.toLocaleString('default', {
      year: 'numeric',
    });
    return transDate;
  }

  getCategories() {
    const savedCategories =
      this.sharedService.getItemFromLocalStorage('categories');
    if (!savedCategories) {
      this.settingsService.getCategories().subscribe(
        (res) => {
          let response = res as any;
          if (response && response.data && response.data.length) {
            response.data.sort((a: Category, b: Category) =>
              a.name.localeCompare(b.name)
            );
            this.sharedService.setItemToLocalStorage(
              'categories',
              response.data
            );
          }
        },
        (err) => {
          this.toastr.error('Failed to fetch transaction categories', 'Error!');
        }
      );
    }

    if (savedCategories?.length) {
      savedCategories.forEach((category: any) => {
        const categoryName = category.name;
        this.categoryCount[categoryName] = 0;
      });
    }
  }

  getTransactions() {
    this.isLoading = true;
    this.transactionService.getTransations().subscribe((res) => {
      const response = res as any;
      if (response) {
        let sortedTransactions = response.data.sort(
          (d1: any, d2: any) =>
            new Date(d2.date).getTime() - new Date(d1.date).getTime()
        );

        this.transactions = this.filteredTransactions = sortedTransactions;

        this.filteredTransactions.forEach((trans) => {
          trans.displayDate = this.setDate(trans.date);
          trans.displayAmount = formatNumber(trans.amount, this.userLocale);
        });

        this.isLoading = false;

        // populate month and year dropdown filter
        if (this.transactions.length) {
          let calendarEvents: any[] = [];

          this.transactions.forEach((trans) => {
            if (trans.category?.name) {
              this.categoryCount[trans.category.name]++;
            }

            let transDate = new Date(trans.date);
            const month = transDate.getMonth() + 1;
            const year = transDate.getFullYear();

            config.months.forEach((monthObj) => {
              if (
                monthObj.key === month &&
                !this.transactionMonths.includes(monthObj)
              ) {
                this.transactionMonths.push(monthObj);
              }
            });

            if (this.transactionMonths && this.transactionMonths.length) {
              this.transactionMonths.sort((a, b) =>
                a.key > b.key ? 1 : b.key > a.key ? -1 : 0
              );
            }

            if (!this.transactionYears.includes(year))
              this.transactionYears.push(year);
          });

          const mostUsedCategories = this.sharedService.getTopValues(this.categoryCount, 7);
          const categoryNames = Object.keys(mostUsedCategories);
          this.sharedService.setItemToLocalStorage('mostUsedCategories', categoryNames)

          // filter all the debit and credit transactions
          let transDebit = this.transactions.filter(
            (trans) => trans.category?.type === 'expense'
          );
          let transCredit = this.transactions.filter(
            (trans) => trans.category?.type === 'income'
          );

          // create a map(key: date of transaction, value: debit amount) for calendar event
          let transDebitMap = new Map();
          let totalDebitAmount = 0;
          transDebit.forEach((trans) => {
            if (transDebitMap.get(trans.date)) {
              totalDebitAmount = transDebitMap.get(trans.date);
              totalDebitAmount += trans.amount;
              transDebitMap.set(trans.date, totalDebitAmount);
            } else {
              transDebitMap.set(trans.date, trans.amount);
            }
          });

          // loop through the keys and create a calendar event
          for (const [key, value] of transDebitMap.entries()) {
            let transactionEvent = {
              title:
                '-' +
                this.currency.symbol +
                formatNumber(value, this.userLocale),
              color: '#FFF',
              textColor: '#FF3131',
              date: key, // calender event accepts date in the iso format yyyy-mm-dd
            };

            calendarEvents.push(transactionEvent);
          }

          // create a map(key: date of transaction, value: credit amount) for calendar event
          let transCreditMap = new Map();
          let totalCreditAmount = 0;
          transCredit.forEach((trans) => {
            if (transCreditMap.get(trans.date)) {
              totalCreditAmount = transCreditMap.get(trans.date);
              totalCreditAmount += trans.amount;
              transCreditMap.set(trans.date, totalCreditAmount);
            } else {
              transCreditMap.set(trans.date, trans.amount);
            }
          });

          // loop through the keys and create a calendar event
          for (const [key, value] of transCreditMap.entries()) {
            let transactionEvent = {
              title:
                '+' +
                this.currency.symbol +
                formatNumber(value, this.userLocale),
              color: '#FFF',
              textColor: '#32CD32',
              date: key,
            };
            calendarEvents.push(transactionEvent);
          }

          this.calendarOptions = {
            initialView: 'dayGridMonth',
            events: calendarEvents,
            dateClick: this.handleDateClick.bind(this),
          };
        }

        this.filterByDate();
      }
    });
  }

  handleDateClick(arg: any) {
    this.openAddTransactionModal(arg.date);
  }

  filterByDate() {
    if (this.selectedMonth && this.selectedYear) {
      this.filteredTransactions = this.transactions.filter((trans) => {
        let transDate = new Date(trans.date);
        const month = transDate.getMonth() + 1;
        const year = transDate.getFullYear();
        return month === this.selectedMonth && year === this.selectedYear;
      });
      this.formatChartData(this.filteredTransactions);
    } else if (this.selectedYear) {
      this.filteredTransactions = this.transactions.filter((trans) => {
        let transDate = new Date(trans.date);
        const year = transDate.getFullYear();
        return year === this.selectedYear;
      });
      this.formatChartData(this.filteredTransactions);
    } else {
      this.filteredTransactions = this.transactions;
      this.formatChartData(this.transactions);
    }
  }

  filterbySearch() {
    if (this.search) {
      let keyword = this.search.toLowerCase();
      let filterTransactionsBasedOnKeyword: Transaction[] = [];
      this.transactions.forEach((trans) => {
        if (
          (trans.category &&
            trans.category.name.toLowerCase().indexOf(keyword) > -1) ||
          (trans.note && trans.note.toLowerCase().indexOf(keyword) > -1)
        ) {
          filterTransactionsBasedOnKeyword.push(trans);
        }
      });
      this.filteredTransactions = filterTransactionsBasedOnKeyword;
    } else {
      this.filteredTransactions = this.transactions;
    }
  }

  formatChartData(transactions: any) {
    let categoryAmountMap = new Map();
    let totalIncome = 0;
    let totalExpense = 0;

    if (transactions.length) {
      transactions.forEach((transaction: any) => {
        if (transaction.category?.type === 'expense') {
          totalExpense += transaction.amount;

          if (categoryAmountMap.has(transaction.category.name)) {
            const amount = categoryAmountMap.get(transaction.category.name);
            let newAmount = amount + transaction.amount;
            categoryAmountMap.set(transaction.category.name, newAmount);
          } else {
            categoryAmountMap.set(
              transaction.category.name,
              transaction.amount
            );
          }
        } else if (transaction.category?.type === 'income') {
          totalIncome += transaction.amount;
        } else {
          // adding a transaction without a category
          totalExpense += transaction.amount;

          if (categoryAmountMap.has(transaction.name)) {
            const amount = categoryAmountMap.get(transaction.name);
            let newAmount = amount + transaction.amount;
            categoryAmountMap.set(transaction.name, newAmount);
          } else {
            categoryAmountMap.set(transaction.name, transaction.amount);
          }
        }
      });
    }

    // formatting the series data for pie chart
    let budgetData: any[] = [];
    categoryAmountMap.forEach((value, key) => {
      budgetData.push({
        name: key ? key : 'Uncategorized',
        y: value,
      });
    });

    this.createExpenseDistributionChart(budgetData);

    let IncomeExpenseData = [totalIncome, totalExpense];
    this.createIncomeExpenseSummaryChart(
      this.IncomeExpenseSummaryContainer.nativeElement.id,
      IncomeExpenseData
    );

    this.createTotalSavingsChart(
      this.TotalSavingsContainer.nativeElement.id,
      totalIncome,
      totalExpense
    );
  }

  createExpenseDistributionChart(data: any) {
    this.expenseDistOptions = {
      chart: {
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
        type: 'pie',
        style: {
          fontFamily: 'Verdana',
        },
      },
      credits: {
        enabled: false,
      },
      exporting: {
        enabled: false,
      },
      title: {
        text: 'Expense Distribution by Category',
      },
      tooltip: {
        pointFormat: this.currency.symbol + '{point.y}',
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f} %',
          },
          // size: 150,
        },
      },
      series: [
        {
          data: data
        },
      ],
    };

    HC_exporting(Highcharts);

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }

  createIncomeExpenseSummaryChart(container: any, data: any) {
    const options: any = {
      chart: {
        type: 'bar',
        height: 200,
        style: {
          fontFamily: 'Verdana',
        },
      },
      title: {
        text: 'Income Expense Summary',
      },
      subtitle: {
        text: '',
      },
      xAxis: {
        categories: ['Income', 'Expense'],
        title: {
          text: null,
        },
      },
      yAxis: {
        min: 0,
        visible: false,
        title: {
          text: '',
          align: 'high',
        },
        labels: {
          overflow: 'justify',
        },
      },
      tooltip: {
        pointFormat: this.currency.symbol + '{point.y}',
      },
      colors: ['#F2B341'],
      plotOptions: {
        series: {
          dataLabels: {
            enabled: true,
            inside: true,
            format: this.currency.symbol + '{y}',
          },
          pointPadding: 0.1,
          groupPadding: 0,
        },
      },
      legend: {
        enabled: false,
      },
      exporting: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
      series: [
        {
          data: data,
        },
      ],
    };

    Highcharts.chart(container, options);

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }

  createTotalSavingsChart(container: any, totalIncome: any, totalExpense: any) {
    const options: any = {
      chart: {
        renderTo: 'container',
        type: 'pie',
      },
      credits: {
        enabled: false,
      },
      exporting: {
        enabled: false,
      },
      title: {
        text: 'Total Savings',
      },
      subtitle: {
        text: this.currency.symbol + '' + (totalIncome - totalExpense),
        verticalAlign: 'middle',
        y: 40,
        style: {
          fontSize: '20px',
        },
      },
      plotOptions: {
        pie: {
          shadow: false,
        },
      },
      series: [
        {
          name: '',
          data: [
            ['Total Income', totalIncome],
            ['Total Expense', totalExpense],
          ],
          tooltip: {
            valuePrefix: this.currency.symbol,
          },
          colors: ['#32CD32', '#FF3131'],
          size: '60%',
          innerSize: '90%',
          showInLegend: false,
          dataLabels: {
            enabled: true,
            format: this.currency.symbol + '{y}',
          },
        },
      ],
    };

    Highcharts.chart(container, options);

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }

  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.messageSubscription.unsubscribe();
  }
}
