import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { MatDialog } from '@angular/material/dialog';
import { ThemePalette } from '@angular/material/core';
import { formatNumber } from '@angular/common';

import { config } from 'src/app/configuration/config';
import { MessageService } from 'src/app/services/message.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { AddTransactionComponent } from './add-transaction/add-transaction.component';
import { Transaction } from 'src/app/models/Transaction';

import * as Highcharts from 'highcharts';

import HC_exporting from 'highcharts/modules/exporting';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { SharedService } from 'src/app/services/shared.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ToastrService } from 'ngx-toastr';
import { Category } from 'src/app/models/Category';
import { fade } from 'src/app/shared/animations';
import { PaymentMode } from 'src/app/models/PaymentMode';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { DateRangeResponse } from 'src/app/models/DateRangeResonse';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/internal/operators';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  animations: [
    fade,
    trigger('flipState', [
      state(
        'true',
        style({
          transform: 'rotateY(180deg)',
        })
      ),
      state(
        'false',
        style({
          transform: 'none',
        })
      ),
      transition('true => false', animate('500ms ease-out')),
      transition('false => true', animate('500ms ease-in')),
    ]),
  ],
})
export class OverviewComponent implements OnInit, AfterViewInit {
  messageSubscription: Subscription;
  isLoadingSubcription: Subscription;
  isLoading: boolean = false;

  transactions: Transaction[] = [];
  currency: any;
  userLocale: string = '';
  Highcharts = Highcharts;
  expenseDistOptions: any;
  expenseDistBarOptions: any;
  totalSavingOptions: any;
  currentUser: any;
  transactionMonths: any[] = [];
  transactionYears: number[] = [];
  selectedMonth: number = 0;
  selectedYear: number = 0;
  paymentMode: number = 0;

  search: string = '';
  private searchSubject: Subject<string> = new Subject();
  private destroy$ = new Subject<void>();

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    headerToolbar: {
      right: ''
    }
  };
  calendarApi!: any;
  color: ThemePalette = 'accent';
  categoryCount: any = {};
  paymentModes: PaymentMode[] = [];
  flip: boolean = false;
  months = config.months;

  private transaction: Transaction = {
    _id: null as any,
    category: {
      name: '',
      type: '',
    },
    date: new Date(),
    displayDate: {},
    paymentMode: 0,
    amount: null as any,
    displayAmount: '',
    note: '',
  };

  @ViewChild('IncomeExpenseSummaryContainer', { static: false })
  IncomeExpenseSummaryContainer: ElementRef<HTMLInputElement> =
    {} as ElementRef;
  @ViewChild('TotalSavingsContainer', { static: false })
  TotalSavingsContainer: ElementRef<HTMLInputElement> = {} as ElementRef;
  @ViewChild('fullCalendar', { static: false })
  fullCalendar!: FullCalendarComponent;

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
          this.getFilteredTransactions();
        }
      });

    this.isLoadingSubcription = this.messageService.isLoading$.subscribe(value => {
      this.isLoading = value;
    })
  }

  ngOnInit(): void {
    this.getCategories();
    this.getPaymentModes();

    this.userLocale = this.sharedService.getItemFromLocalStorage('userLocale') || 'en-IN';
    let settings = this.sharedService.getItemFromLocalStorage('settings');
    if (settings && settings.currency) {
      this.currency = settings.currency;
    }

    this.currentUser =
      this.sharedService.getItemFromLocalStorage('current_user');

    this.selectedMonth = this.sharedService.now.month;
    this.selectedYear = this.sharedService.now.year;
    this.getTransactionsDateRange();
    if (this.selectedMonth && this.selectedYear) this.getFilteredTransactions();

    this.searchSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(_ => {
      this.getFilteredTransactions();
    });
  }

  ngAfterViewInit(): void {
    this.calendarApi = this.fullCalendar.getApi();
  }

  toggleFlip() {
    this.flip = !this.flip;
  }

  resetTransactions() {
    this.transactions = [];
  }

  clearFilter() {
    this.resetTransactions();
    this.search = '';
    this.paymentMode = 0;
    this.selectedMonth = this.selectedYear = 0;
    this.getTransactions();
  }

  openAddTransactionModal(dateSelectedFromCalendar: Date = new Date()) {
    this.transaction.date = dateSelectedFromCalendar;
    this.dialog.open(AddTransactionComponent, {
      width: '550px',
      data: this.transaction,
    });
  }

  getCategories() {
    let savedCategories = this.sharedService.getItemFromLocalStorage('categories');
    if (!savedCategories) {
      this.settingsService.getCategories().subscribe(
        (res) => {
          let response = res as any;
          if (response && response.data && response.data.length) {
            response.data.sort((a: Category, b: Category) => a.name.localeCompare(b.name));
            this.sharedService.setItemToLocalStorage('categories', response.data);

            this.setCategoryCount(response.data);
          }
        },
        (err) => {
          this.toastr.error('Failed to fetch transaction categories', 'Error!');
        }
      );
    }

    if (savedCategories?.length) {
      this.setCategoryCount(savedCategories);
    }
  }

  getPaymentModes() {
    this.settingsService.getPaymentModes().subscribe(
      (res) => {
        let response = res as any;
        this.paymentModes = response.data;
        this.sharedService.setItemToLocalStorage('paymentModes', response.data);
      },
      (err) => {
        this.toastr.error('Failed to fetch payment modes', 'Error!');
      }
    );
  }

  get dashboardView() {
    return this.paymentModes?.find(mode => mode.type === this.paymentMode);
  }

  setCategoryCount(data: Category[]) {
    if (data?.length) {
      data.forEach((category: any) => {
        const categoryName = category.name;
        this.categoryCount[categoryName] = 0;
      });
    }
  }

  getTransactionsDateRange() {
    this.transactionService.getTransactionsDateRange().subscribe((res: any) => {
      const dateRange = <DateRangeResponse>res?.data;
      const firstDate = new Date(dateRange.firstDate);
      const lastDate = new Date(dateRange.lastDate);
      this.populateMonthYearOptions(firstDate, lastDate);
    });
  }

  populateMonthYearOptions(firstDate: Date, lastDate: Date) {
    const firstYear = firstDate.getFullYear();
    const lastYear = lastDate.getFullYear();

    for (let year = firstYear; year <= lastYear; year++) {
      if (!this.transactionYears.includes(year)) this.transactionYears.push(year);

      for (let month = 1; month <= 12; month++) {
        const monthObj = config.months.find(m => m.key === month);
        if (!this.transactionMonths.includes(monthObj)) {
          this.transactionMonths.push(monthObj);
        }
      }
    }
  }

  onDateChange() {
    this.resetTransactions();
    this.getFilteredTransactions();
  }

  getTransactions() {
    this.messageService.setIsLoading(true);
    this.transactionService.getTransations().subscribe((res) => {
      this.messageService.setIsLoading(false);
      const transactions = <Transaction[]>res;
      this.transactions = transactions;
      this.populateExpenseCharts();
      this.populateCalendar();
    });
  }

  onSearchChange(searchKeyword: string): void {
    this.searchSubject.next(searchKeyword);
  }

  getFilteredTransactions() {
    this.messageService.setIsLoading(true);
    const params = {
      month: this.selectedMonth,
      year: this.selectedYear,
      search: this.search,
      paymentMode: this.paymentMode
    }
    this.transactionService.getFilteredTransactions(params).subscribe((res) => {
      this.messageService.setIsLoading(false);
      const transactions = <Transaction[]>res;
      this.transactions = transactions;
      this.populateExpenseCharts();
      this.populateCalendar();
    });
  }

  populateCalendar() {
    if (this.transactions.length) {
      let calendarEvents: any[] = [];

      // filter all the debit and credit transactions
      let transDebit = this.transactions.filter((trans) => trans.category?.type === 'expense');
      let transCredit = this.transactions.filter((trans) => trans.category?.type === 'income');

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
          title: '-' + this.currency.symbol + formatNumber(value, this.userLocale),
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
          title: '+' + this.currency.symbol + formatNumber(value, this.userLocale),
          color: '#FFF',
          textColor: '#32CD32',
          date: key,
        };
        calendarEvents.push(transactionEvent);
      }

      this.calendarOptions = {
        events: calendarEvents,
        dateClick: this.handleDateClick.bind(this),
      };

      this.goToDate();  // Navigate FullCalendar instance to selected date
    } else {
      this.calendarOptions = {
        events: [],
        dateClick: this.handleDateClick.bind(this),
      };
    }
  }

  goToDate() {
    if (this.selectedMonth && this.selectedYear) {
      const selectedDate = new Date(this.selectedYear, this.selectedMonth - 1, 1);
      this.calendarApi.gotoDate(selectedDate);
    }
    else if (this.selectedYear) {
      // Navigate to the start of the selected year and restrict navigation to the current year
      const startDate = new Date(this.selectedYear, 0, 1);
      const endDate = new Date(this.selectedYear, 11, 31);
      this.calendarApi.gotoDate(startDate);

      // Manually format dates to YYYY-MM-DD
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      this.calendarOptions = {
        ...this.calendarOptions,
        validRange: {
          start: formatDate(startDate),
          end: formatDate(endDate)
        },
        headerToolbar: {
          right: 'today prev,next'
        }
      };
    }
    else {
      // Move to the current month and show navigation buttons
      const currentMonth = this.sharedService.now.month;
      const currentYear = this.sharedService.now.year;
      const currentDate = new Date(currentYear, currentMonth, 1);
      this.calendarOptions = {
        ...this.calendarOptions,
        headerToolbar: {
          right: 'today prev,next'
        }
      };
      this.calendarApi.gotoDate(currentDate);
    }
  }

  setMostUsedCategories() {
    if (this.categoryCount) {
      const mostUsedCategories = this.sharedService.getTopValues(this.categoryCount, 7);
      const categoryNames = Object.keys(mostUsedCategories);
      this.sharedService.setItemToLocalStorage('mostUsedCategories', categoryNames);
    }
  }

  handleDateClick(arg: any) {
    this.openAddTransactionModal(arg.date);
  }

  populateExpenseCharts() {
    this.formatChartData(this.transactions);
  }

  onViewChange() {
    this.getFilteredTransactions();
    this.formatChartData(this.transactions);
  }

  formatChartData(transactions: Transaction[]) {
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

      // formatting the series data for pie chart
      let budgetData: any[] = [];
      categoryAmountMap.forEach((value, key) => {
        budgetData.push({
          name: key ? key : 'Uncategorized',
          y: value,
        });
      });

      if (budgetData?.length) {
        this.createExpenseDistributionChart(budgetData);
        this.createExpenseDistributionBarChart(budgetData);
      }

      let IncomeExpenseData = [totalIncome, totalExpense];
      if (IncomeExpenseData?.length && (totalExpense > 0 || totalIncome > 0)) {
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
    } else {
      this.createExpenseDistributionChart([]);
      this.createExpenseDistributionBarChart([]);
      this.createIncomeExpenseSummaryChart(this.IncomeExpenseSummaryContainer.nativeElement.id, []);
      this.createTotalSavingsChart(this.TotalSavingsContainer.nativeElement.id, 0, 0);
    }
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
      legend: {
        enabled: false,
        itemStyle: {
          color: '#A0A0A0',
        },
        itemHoverStyle: {
          color: '#A0A0A0',
        },
        labelFormatter: function () {
          const chart = this as any;
          return (
            chart.name +
            ': ' +
            Highcharts.numberFormat(chart.y, 0, '.', ',') +
            ' (' +
            Highcharts.numberFormat(chart.percentage, 2) +
            '%' +
            ')'
          );
        },
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          shadow: true,
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f} %',
            distance: 5,
          },
          showInLegend: true,
          // size: '30%',
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

  expenseDistChartCb: Highcharts.ChartCallbackFunction = (chart) => {
    chart.reflow();
  };

  createExpenseDistributionBarChart(data: any) {
    this.expenseDistBarOptions = {
      chart: {
        type: 'bar',
      },
      title: {
        text: 'Expense Distribution by Category',
      },
      xAxis: {
        type: 'category',
      },
      yAxis: {
        title: false,
        gridLineColor: 'transparent',
      },
      credits: {
        enabled: false,
      },
      exporting: {
        enabled: false,
      },
      legend: {
        enabled: false,
      },
      plotOptions: {
        series: {
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            format: this.currency.symbol + '{point.y}',
          },
          borderRadius: 5,
        },
      },
      tooltip: {
        // pointFormat: '<b>{point.name}</b>: {point.percentage:.1f} %',
        formatter: function () {
          const chart = this as any;
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            sum = sum + chart.series.data[i].y;
          }
          let percent = (100 * chart.y) / sum;
          percent = +percent.toFixed(1);
          return chart.point.name + ': ' + percent + '%';
        },
      },
      series: [
        {
          name: 'Expense',
          colorByPoint: true,
          data: data,
        },
      ],
    };
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
      plotOptions: {
        series: {
          dataLabels: {
            enabled: true,
            inside: true,
            format: this.currency.symbol + '{point.y:,.0f}',
          },
          pointPadding: 0.1,
          groupPadding: 0,
          colorByPoint: true,
          colors: [' #32CD32', '#FF3131'],
          borderRadius: 5,
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
    // const colors: any = Highcharts.getOptions().colors?.map(function (color: string) {
    //   return {
    //     radialGradient: {
    //       cx: 0.4,
    //       cy: 0.3,
    //       r: 0.5,
    //     },
    //     stops: [
    //       [0, color],
    //       [1, Highcharts.color(color).brighten(-0.3).get('rgb')],
    //     ],
    //   };
    // });

    // Highcharts.setOptions({
    //   colors: colors,
    // });

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
        text:
          this.currency.symbol +
          '' +
          formatNumber(totalIncome - totalExpense, this.userLocale),
        verticalAlign: 'middle',
        y: 40,
        style: {
          fontSize: '20px',
        },
      },
      plotOptions: {
        pie: {
          shadow: true,
        },
      },
      series: [
        {
          name: '',
          data: [
            ['Remaining balance', totalIncome - totalExpense],
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
            enabled: false,
            format: this.currency.symbol + '{point.y:,.0f}',
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
    this.destroy$.next();
    this.destroy$.complete();
  }
}
