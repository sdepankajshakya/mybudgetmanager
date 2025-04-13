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
import listPlugin from '@fullcalendar/list';

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
    plugins: [dayGridPlugin, listPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,next today',
      right: 'dayGridMonth,listWeek'
    },
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

  @ViewChild('IncomeExpenseSummaryContainer', { static: false }) IncomeExpenseSummaryContainer: ElementRef<HTMLInputElement> = {} as ElementRef;
  @ViewChild('TotalSavingsContainer', { static: false }) TotalSavingsContainer: ElementRef<HTMLInputElement> = {} as ElementRef;
  @ViewChild('fullCalendar', { static: false }) fullCalendar!: FullCalendarComponent;

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

    // auto-switch the calendar view
    window.addEventListener('resize', () => {
      const newView = window.innerWidth < 768 ? 'listWeek' : 'dayGridMonth';

      if (this.calendarApi.view.type !== newView) {
        this.calendarApi.changeView(newView);
      }
    });
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
          title: `-${this.currency.symbol}${formatNumber(value, this.userLocale)}`,
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

        // Apply color using eventDidMount
        eventDidMount: (info) => {
          const titleEl = info.el.querySelector('.fc-list-event-title');
          const isListView = info.view.type.startsWith('list');

          // Apply text color for both List and Month views
          if (titleEl) {
            (titleEl as HTMLElement).style.color = info.event.textColor || ''; // Apply the dynamic color
          }

          // You can also apply specific styles to background, dots, etc.
          if (isListView) {
            const dotEl = info.el.querySelector('.fc-list-event-dot');
            if (dotEl) {
              (dotEl as HTMLElement).style.display = 'none'; // Hide dot icon in list view if needed
            }
          }
        }
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
    const currencySymbol = this.currency?.symbol || '$';

    this.expenseDistOptions = {
      chart: {
        type: 'pie',
        backgroundColor: 'transparent',
        plotShadow: false,
        style: {
          fontFamily: 'Segoe UI, Verdana, sans-serif',
        },
      },
      title: {
        text: 'Expense Distribution by Category',
        align: 'center',
        style: {
          fontSize: '16px',
          fontWeight: '600',
          color: '#333',
        },
      },
      tooltip: {
        pointFormat: `${currencySymbol}{point.y}`,
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderRadius: 8,
        style: {
          color: '#333',
        },
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
            '%)'
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
            style: {
              color: '#444',
              fontWeight: '500',
            },
          },
          showInLegend: true,
          borderWidth: 0,
          innerSize: '0%', // No donut
        },
      },
      series: [
        {
          name: 'Expenses',
          data: data,
        },
      ],
      credits: {
        enabled: false,
      },
      exporting: {
        enabled: false,
      },
    };

    HC_exporting(Highcharts);

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }

  expenseDistChartCb: Highcharts.ChartCallbackFunction = (chart) => {
    chart.reflow();
  };

  createExpenseDistributionBarChart(data: any[]) {
    const currencySymbol = this.currency?.symbol || '$';

    this.expenseDistBarOptions = {
      chart: {
        type: 'bar',
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'Segoe UI, Verdana, sans-serif',
        },
      },
      title: {
        text: 'Expense Distribution by Category',
        align: 'left',
        style: {
          fontSize: '16px',
          fontWeight: '600',
          color: '#333',
        },
      },
      xAxis: {
        type: 'category',
        labels: {
          style: {
            color: '#666',
          },
        },
      },
      yAxis: {
        title: {
          text: null,
        },
        gridLineColor: 'transparent',
        labels: {
          enabled: false,
        },
      },
      tooltip: {
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
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderRadius: 8,
        style: {
          color: '#333',
        },
      },
      plotOptions: {
        series: {
          borderWidth: 0,
          borderRadius: 5,
          dataLabels: {
            enabled: true,
            format: `${currencySymbol}{point.y}`,
            style: {
              color: '#444',
              fontWeight: '500',
            },
          },
        },
      },
      series: [
        {
          name: 'Expense',
          colorByPoint: true,
          data,
        },
      ],
      legend: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
      exporting: {
        enabled: false,
      },
    };
  }

  createIncomeExpenseSummaryChart(container: any, data: any) {
    const options: any = {
      chart: {
        type: 'bar',
        height: 200,
        style: {
          fontFamily: 'Segoe UI, Verdana, sans-serif',
        },
        backgroundColor: 'transparent',
      },
      title: {
        text: 'Income vs Expense',
        style: {
          fontSize: '16px',
          fontWeight: '600',
          color: '#333',
        },
      },
      xAxis: {
        categories: ['Income', 'Expense'],
        lineColor: '#ccc',
        labels: {
          style: {
            color: '#666',
            fontSize: '13px',
          },
        },
      },
      yAxis: {
        visible: false,
      },
      tooltip: {
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderRadius: 8,
        style: {
          color: '#333',
        },
        pointFormat: `<span style="color:{point.color}">\u25CF</span> <b>{series.name}</b>: ${this.currency.symbol}{point.y}`,
      },
      plotOptions: {
        series: {
          dataLabels: {
            enabled: true,
            inside: true,
            style: {
              fontWeight: '600',
              color: '#fff',
            },
            format: this.currency.symbol + '{point.y:,.0f}',
          },
          borderRadius: 8,
          pointPadding: 0.2,
          groupPadding: 0.05,
          colorByPoint: true,
          colors: [
            {
              linearGradient: [0, 0, 300, 0],
              stops: [
                [0, '#2ecc71'],
                [1, '#27ae60'],
              ],
            },
            {
              linearGradient: [0, 0, 300, 0],
              stops: [
                [0, '#ff6b6b'],
                [1, '#e74c3c'],
              ],
            },
          ],
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
          name: 'Summary',
          data: data,
        },
      ],
    };

    Highcharts.chart(container, options);

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }

  createTotalSavingsChart(container: any, totalIncome: number, totalExpense: number) {
    const remaining = totalIncome - totalExpense;
    const currencySymbol = this.currency?.symbol || '$';

    const options: any = {
      chart: {
        type: 'pie',
        height: 250,
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'Segoe UI, Verdana, sans-serif',
        },
      },
      title: {
        text: 'Total Savings',
        align: 'center',
        verticalAlign: 'middle',
        y: -10,
        style: {
          fontSize: '16px',
          fontWeight: '600',
          color: '#333',
        },
      },
      subtitle: {
        text: `${currencySymbol}${formatNumber(remaining, this.userLocale)}`,
        align: 'center',
        verticalAlign: 'middle',
        y: 20,
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          color: remaining >= 0 ? '#27ae60' : '#e74c3c',
        },
      },
      tooltip: {
        pointFormat: `<span style="color:{point.color}">\u25CF</span> <b>{point.name}</b>: ${currencySymbol}{point.y:,.0f}`,
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderRadius: 8,
        style: {
          color: '#333',
        },
      },
      plotOptions: {
        pie: {
          innerSize: '90%',
          borderWidth: 0,
          dataLabels: {
            enabled: false,
          },
          startAngle: 0,
          endAngle: 360,
          center: ['50%', '50%'],
        },
      },
      series: [
        {
          name: 'Savings',
          data: [
            {
              name: 'Remaining Balance',
              y: remaining,
              color: {
                linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
                stops: [
                  [0, '#2ecc71'],
                  [1, '#27ae60'],
                ],
              },
            },
            {
              name: 'Total Expense',
              y: totalExpense,
              color: {
                linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
                stops: [
                  [0, '#ff6b6b'],
                  [1, '#e74c3c'],
                ],
              },
            },
          ],
        },
      ],
      legend: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
      exporting: {
        enabled: false,
      },
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
