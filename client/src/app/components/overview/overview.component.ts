import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';

import { config } from 'src/app/configuration/config';
import { MessageService } from 'src/app/services/message.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { AddTransactionComponent } from './add-transaction/add-transaction.component';
import { Transaction } from 'src/app/models/transaction';

import * as Highcharts from 'highcharts';

import HC_exporting from 'highcharts/modules/exporting';

import { MatDialog } from '@angular/material/dialog';
import { SharedService } from 'src/app/services/shared.service';
import { ThemePalette } from '@angular/material/core';
import { SettingsService } from 'src/app/services/settings.service';
import { ToastrService } from 'ngx-toastr';

export interface DialogData {
  animal: string;
  name: string;
}

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnInit {
  messageSubscription: Subscription;
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  currencySymbol: string = '';
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

    let settings = this.sharedService.getItemFromLocalStorage('settings');
    if (settings && settings.currency) {
      this.currencySymbol = settings.currency.symbol;
    }

    this.currentUser =
      this.sharedService.getItemFromLocalStorage('current_user');
  }

  openAddTransactionModal() {
    this.dialog.open(AddTransactionComponent, {
      width: '550px',
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
          this.sharedService.setItemToLocalStorage('categories', response.data);
        },
        (err) => {
          this.toastr.error('Failed to fetch transaction categories', 'Error!');
        }
      );
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
        });

        this.isLoading = false;

        // populate month and year dropdown filter
        if (this.transactions.length) {
          let calendarEvents: any[] = [];

          this.transactions.forEach((trans) => {
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

            if (!this.transactionYears.includes(year))
              this.transactionYears.push(year);
          });

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
              title: '-' + value,
              color: '#FFF',
              textColor: 'red',
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
              title: '+' + value,
              color: '#FFF',
              textColor: 'green',
              date: key,
            };
            calendarEvents.push(transactionEvent);
          }

          this.calendarOptions = {
            initialView: 'dayGridMonth',
            events: calendarEvents,
          };
        }

        this.filterByDate();
      }
    });
  }

  filterByDate() {
    if (this.selectedMonth && this.selectedYear) {
      this.filteredTransactions = this.transactions.filter((trans) => {
        let transDate = new Date(trans.date);
        const month = transDate.getMonth() + 1;
        const year = transDate.getFullYear();
        return month === this.selectedMonth && year === this.selectedYear;
      });

      // this.filterbySearch();

      this.formatChartData(this.filteredTransactions);
    } else {
      this.formatChartData(this.transactions);
    }
  }

  filterbySearch() {
    if (this.search) {
      let keyword = this.search.toLowerCase();
      this.filteredTransactions = this.transactions.filter((trans) =>
        trans.note ? trans.note.toLowerCase().indexOf(keyword) > -1 : null
      );
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
        pointFormat: this.currencySymbol + '{point.y}',
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
          data: data,
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
        pointFormat: this.currencySymbol + '{point.y}',
      },
      colors: ['#F2B341'],
      plotOptions: {
        series: {
          dataLabels: {
            enabled: true,
            inside: true,
            format: this.currencySymbol + '{y}',
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
        text: this.currencySymbol + '' + (totalIncome - totalExpense),
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
          name: 'Savings',
          data: [
            ['Total Income', totalIncome],
            ['Total Expense', totalExpense],
          ],
          colors: ['green', 'red'],
          size: '60%',
          innerSize: '90%',
          showInLegend: false,
          dataLabels: {
            enabled: false,
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
