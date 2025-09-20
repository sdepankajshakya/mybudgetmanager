import {
  AfterViewInit,
  ChangeDetectorRef,
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
import { FilterModalComponent } from './filter-modal/filter-modal.component';
import { Transaction } from 'src/app/models/Transaction';

import * as Highcharts from 'highcharts';

import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

import { SharedService } from 'src/app/services/shared.service';
import { SettingsService } from 'src/app/services/settings.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { Category } from 'src/app/models/Category';
import { fade } from 'src/app/shared/animations';
import { PaymentMode } from 'src/app/models/PaymentMode';
// Removed flipState animation utilities
import { DateRangeResponse } from 'src/app/models/DateRangeResonse';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  animations: [
  fade,
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  
  messageSubscription: Subscription;
  isLoadingSubcription: Subscription;
  isLoading: boolean = false;

  transactions: Transaction[] = [];
  currency: any;
  userLocale: string = '';
  Highcharts = Highcharts;
  expenseDistBarOptions: any;
  // Line chart data for Income and Expense trends (two separate charts)
  incomeCategories: string[] = [];
  incomeSeries: Highcharts.SeriesOptionsType[] = [];
  expenseCategories: string[] = [];
  expenseSeries: Highcharts.SeriesOptionsType[] = [];
  // Total Balance (running) trend
  balanceCategories: string[] = [];
  balanceSeries: Highcharts.SeriesOptionsType[] = [];
  totalBalanceAmount: number = 0;
  totalIncomeAmount: number = 0;
  totalExpenseAmount: number = 0;
  incomeTooltipFormatter?: Highcharts.TooltipFormatterCallbackFunction;
  expenseTooltipFormatter?: Highcharts.TooltipFormatterCallbackFunction;
  balanceTooltipFormatter?: Highcharts.TooltipFormatterCallbackFunction;
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

  // Computed properties to avoid method calls in template
  get showWelcome(): boolean {
    return this.isLoading || (!this.hasActiveFilters() && this.transactions.length === 0);
  }

  get hasTransactionData(): boolean {
    return this.transactions.length > 0 || this.hasActiveFilters();
  }

  get showFinancialOverviewData(): boolean {
    return this.totalIncomeAmount > 0 || this.totalExpenseAmount > 0;
  }

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    initialDate: new Date(),
    plugins: [dayGridPlugin, listPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,next',
      right: 'dayGridMonth,listMonth'
    },
  };

  calendarApi!: any;
  color: ThemePalette = 'primary';
  categoryCount: any = {};
  paymentModes: PaymentMode[] = [];
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

  // Removed Income vs Expense and Total Savings charts
  @ViewChild('fullCalendar', { static: false }) fullCalendar!: FullCalendarComponent;
  @ViewChild('recentTransactionsSection', { static: false }) recentTransactionsSection!: ElementRef;

  constructor(
    private transactionService: TransactionService,
    public dialog: MatDialog,
    private messageService: MessageService,
    private sharedService: SharedService,
    private settingsService: SettingsService,
    private snackbar: SnackbarService,
    private cdr: ChangeDetectorRef
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
      
      // When loading completes, ensure calendar renders properly
      if (!value && this.fullCalendar) {
        setTimeout(() => {
          this.fullCalendar?.getApi().render();
        }, 100);
      }
    });
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
      this.getFilteredTransactions(true);
    });
  }

  ngAfterViewInit(): void {
    this.calendarApi = this.fullCalendar.getApi();
    // Navigate to current date after calendar is initialized
    setTimeout(() => {
      if (this.calendarApi) {
        this.calendarApi.gotoDate(new Date());
      }
    }, 100);
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

  hasActiveFilters(): boolean {
    return !!(this.selectedMonth || this.paymentMode || this.search?.trim());
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.selectedMonth) count++;
    if (this.paymentMode) count++;
    if (this.search?.trim()) count++;
    return count;
  }

  getPaymentModeName(paymentModeId: number): string {
    const paymentMode = this.paymentModes.find(pm => pm.type === paymentModeId);
    return paymentMode?.name || 'Unknown';
  }

  clearMonthFilter(): void {
    this.selectedMonth = 0;
    this.selectedYear = 0;
    this.getFilteredTransactions();
    this.cdr.detectChanges();
  }

  clearPaymentModeFilter(): void {
    this.paymentMode = 0;
    this.getFilteredTransactions();
    this.cdr.detectChanges();
  }

  clearSearchFilter(): void {
    this.search = '';
    this.getFilteredTransactions();
    this.cdr.detectChanges();
  }

  openAddTransactionModal(dateSelectedFromCalendar: Date = new Date()) {
    this.transaction.date = dateSelectedFromCalendar;
    this.dialog.open(AddTransactionComponent, {
      width: '550px',
      data: {
        transaction: this.transaction,
        isEdit: false
      },
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
          this.snackbar.error('Failed to fetch transaction categories');
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
        this.snackbar.error('Failed to fetch payment modes');
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

  onSearchButtonClick(): void {
    this.onSearchChange(this.search);
  }

  isMobileView(): boolean {
    return window.innerWidth < 768;
  }

  getFilteredTransactions(maintainScrollPosition: boolean = false) {
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
      
      // Maintain scroll position at the recent transactions section only when requested and on mobile
      if (maintainScrollPosition && this.recentTransactionsSection && this.isMobileView()) {
        setTimeout(() => {
          this.recentTransactionsSection.nativeElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 100);
      }
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
          title: `-${formatNumber(value, this.userLocale)}`,
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
          title: `+${formatNumber(value, this.userLocale)}`,
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
          right: 'prev,next'
        }
      };
    }
    else {
      // Move to the current month and show navigation buttons
      const currentDate = new Date(); // Use current date directly
      this.calendarOptions = {
        ...this.calendarOptions,
        headerToolbar: {
          right: 'prev,next'
        }
      };
      this.calendarApi.gotoDate(currentDate);
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
  // First populate the trend charts for Income and Expense
  this.populateIncomeExpenseTrendCharts(transactions);

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
        this.createExpenseDistributionBarChart(budgetData);
      }

      let IncomeExpenseData = [totalIncome, totalExpense];
      if (IncomeExpenseData?.length && (totalExpense > 0 || totalIncome > 0)) {
  // summary and savings charts removed
      }
    } else {
      this.createExpenseDistributionBarChart([]);
  // summary and savings charts removed
  this.incomeCategories = [];
  this.incomeSeries = [];
  this.expenseCategories = [];
  this.expenseSeries = [];
    }
  }
  // Remove pie chart logic entirely; bar chart is the only visualization for expense distribution

  /**
   * Build time-series line charts for Income and Expense separately.
   * If any filter is active (month/year/search/paymentMode), group by day; otherwise group by month.
   */
  populateIncomeExpenseTrendCharts(transactions: Transaction[]) {
    if (!transactions || !transactions.length) {
      this.incomeCategories = [];
      this.incomeSeries = [];
      this.expenseCategories = [];
      this.expenseSeries = [];
  this.balanceCategories = [];
  this.balanceSeries = [];
  this.totalIncomeAmount = 0;
  this.totalExpenseAmount = 0;
  this.totalBalanceAmount = 0;
  this.incomeTooltipFormatter = this.getLineTooltipFormatter(this.currency?.symbol || '');
  this.expenseTooltipFormatter = this.getLineTooltipFormatter(this.currency?.symbol || '');
  this.balanceTooltipFormatter = this.getLineTooltipFormatter(this.currency?.symbol || '');
      return;
    }

    const isFiltered = !!(this.selectedMonth || this.selectedYear || (this.search && this.search.trim()) || this.paymentMode);
    const groupByDay = isFiltered; // daily if filtered, else monthly

    // Helper maps
    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();

    const toKey = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      return groupByDay ? `${yyyy}-${mm}-${dd}` : `${yyyy}-${mm}`; // month key
    };

    for (const t of transactions) {
      const d = new Date(t.date as any);
      const key = toKey(d);
      if (t.category?.type === 'income') {
        incomeMap.set(key, (incomeMap.get(key) || 0) + t.amount);
      } else {
        expenseMap.set(key, (expenseMap.get(key) || 0) + t.amount);
      }
    }

    // Collect and sort keys chronologically
    const keys = Array.from(new Set([ ...incomeMap.keys(), ...expenseMap.keys() ])).sort();

    // Format display labels
    const labels = keys.map(k => {
      if (groupByDay) {
        // yyyy-mm-dd -> dd MMM
        const [y, m, d] = k.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const monthName = config.months[date.getMonth()].value;
        return `${d} ${monthName}`; // e.g., 05 Jan
      } else {
        // yyyy-mm -> MMM yyyy
        const [y, m] = k.split('-').map(Number);
        const monthName = config.months[m - 1].value;
        return `${monthName} ${y}`;
      }
    });

    const incomeData = keys.map(k => incomeMap.get(k) || 0);
    const expenseData = keys.map(k => expenseMap.get(k) || 0);
  const netData = keys.map((k, i) => (incomeMap.get(k) || 0) - (expenseMap.get(k) || 0));
  let running = 0; const runningBalance: number[] = [];
  netData.forEach(v => { running += v; runningBalance.push(running); });

    this.incomeCategories = labels;
    this.expenseCategories = labels;
  this.balanceCategories = labels;

    this.incomeSeries = [
      { name: 'Income', type: 'line', data: incomeData, color: '#2ecc71' } as any,
    ];
    this.expenseSeries = [
      { name: 'Expense', type: 'line', data: expenseData, color: '#e74c3c' } as any,
    ];
    this.balanceSeries = [
      { name: 'Balance', type: 'line', data: runningBalance, color: '#2e8b57' } as any,
    ];

  // Totals for display on the cards
  this.totalIncomeAmount = incomeData.reduce((a, b) => a + b, 0);
  this.totalExpenseAmount = expenseData.reduce((a, b) => a + b, 0);
    this.totalBalanceAmount = this.totalIncomeAmount - this.totalExpenseAmount;

  // Tooltip formatters with currency symbol
  const currencySymbol = this.currency?.symbol || '';
  this.incomeTooltipFormatter = this.getLineTooltipFormatter(currencySymbol);
  this.expenseTooltipFormatter = this.getLineTooltipFormatter(currencySymbol);
    this.balanceTooltipFormatter = this.getLineTooltipFormatter(currencySymbol);
  }

  private getLineTooltipFormatter(currencySymbol: string) {
    const h = Highcharts;
    const self = this;
    return function (this: any) {
      // shared tooltip context provides points array
      const points = this.points || (this.point ? [this.point] : []);
      let s = `<b>${this.x}</b>`;
      points.forEach((p: any) => {
        s += `<br/><span style=\"color:${p.color}\">●</span> ${p.series.name}: ${currencySymbol}${h.numberFormat(p.y, 0)}`;
      });
      return s;
    } as Highcharts.TooltipFormatterCallbackFunction;
  }

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
        text: '',
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

  // Filter Modal Methods
  openFilterModal(): void {
    const dialogRef = this.dialog.open(FilterModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        transactionMonths: this.transactionMonths,
        transactionYears: this.transactionYears,
        paymentModes: this.paymentModes,
        currentFilters: {
          selectedMonth: this.selectedMonth || null,
          selectedYear: this.selectedYear || null,
          paymentMode: this.paymentMode
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedMonth = result.selectedMonth;
        this.selectedYear = result.selectedYear;
        this.paymentMode = result.paymentMode;
        
        // Trigger the data refresh
        this.onDateChange();
        this.onViewChange();
        
        // Force change detection to update the UI
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.messageSubscription.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
