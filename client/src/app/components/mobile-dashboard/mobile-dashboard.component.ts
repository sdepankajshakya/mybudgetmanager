import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TransactionService } from '../../services/transaction.service';
import { SettingsService } from '../../services/settings.service';
import { SharedService } from '../../services/shared.service';
import { MessageService } from '../../services/message.service';
import { SnackbarService } from '../../services/snackbar.service';
import { AddTransactionComponent } from '../dashboard/add-transaction/add-transaction.component';
import { Transaction } from '../../models/Transaction';
import { Category } from '../../models/Category';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import * as Highcharts from 'highcharts';
import { formatNumber } from '@angular/common';

@Component({
  selector: 'app-mobile-dashboard',
  templateUrl: './mobile-dashboard.component.html',
  styleUrls: ['./mobile-dashboard.component.scss']
})
export class MobileDashboardComponent implements OnInit, OnDestroy {
  selectedTab = 0; // 0: Analytics, 1: Calendar, 2: Transactions, 3: Settings
  transactions: Transaction[] = [];
  currency: any;
  currentUser: any;
  userLocale: string = 'en-IN';
  totalIncomeAmount: number = 0;
  totalExpenseAmount: number = 0;
  totalBalanceAmount: number = 0;
  messageSubscription: Subscription;
  Highcharts = Highcharts;
  expenseDistBarOptions: any;
  categoryCount: any = {};
  
  constructor(
    public dialog: MatDialog,
    private transactionService: TransactionService,
    private settingsService: SettingsService,
    private sharedService: SharedService,
    private messageService: MessageService,
    private snackbar: SnackbarService,
    private router: Router
  ) {
    this.currency = {
      code: '',
      decimal_digits: 0,
      name: '',
      symbol: '',
    };
    
    this.messageSubscription = this.messageService.getMessage().subscribe((message: any) => {
      if (message.text === 'transaction deleted' || message.text === 'transaction saved') {
        this.loadTransactions();
      }
    });
  }

  ngOnInit(): void {
    this.currentUser = this.sharedService.getItemFromLocalStorage('current_user');
    this.userLocale = this.sharedService.getItemFromLocalStorage('userLocale') || 'en-IN';
    let settings = this.sharedService.getItemFromLocalStorage('settings');
    if (settings && settings.currency) {
      this.currency = settings.currency;
    }
    
    this.loadCategories();
    this.loadTransactions();
  }

  loadTransactions(): void {
    const now = this.sharedService.now;
    const params = {
      month: now.month,
      year: now.year,
      search: '',
      paymentMode: 0
    };
    
    this.transactionService.getFilteredTransactions(params).subscribe(
      (res) => {
        const transactions = <Transaction[]>res;
        this.transactions = transactions;
        this.calculateTotals();
        this.populateExpenseCharts();
      },
      (err) => {
        this.snackbar.error('Failed to fetch transactions');
      }
    );
  }

  loadCategories(): void {
    let savedCategories = this.sharedService.getItemFromLocalStorage('categories');
    if (savedCategories?.length) {
      savedCategories.forEach((category: any) => {
        this.categoryCount[category.name] = 0;
      });
    }
  }

  populateExpenseCharts(): void {
    const transExpense = this.transactions.filter(trans => trans.category?.type === 'expense');
    
    // Reset category counts
    Object.keys(this.categoryCount).forEach(key => {
      this.categoryCount[key] = 0;
    });
    
    // Count expenses by category
    transExpense.forEach(trans => {
      if (trans.category && this.categoryCount.hasOwnProperty(trans.category.name)) {
        this.categoryCount[trans.category.name] += trans.amount;
      }
    });
    
    // Prepare chart data
    const categoryData = Object.keys(this.categoryCount)
      .filter(key => this.categoryCount[key] > 0)
      .map(key => ({
        name: key,
        y: this.categoryCount[key]
      }))
      .sort((a, b) => b.y - a.y);
    
    this.expenseDistBarOptions = {
      chart: { type: 'column', height: 300 },
      title: { text: null },
      xAxis: {
        type: 'category',
        labels: { rotation: -45, style: { fontSize: '12px' } }
      },
      yAxis: {
        min: 0,
        title: { text: `Amount (${this.currency?.symbol})` }
      },
      legend: { enabled: false },
      tooltip: {
        formatter: function(this: any) {
          return `<b>${this.point.name}</b><br/>Amount: ${formatNumber(this.point.y, 'en-IN')}`;
        }
      },
      series: [{
        name: 'Expenses',
        data: categoryData,
        colorByPoint: true
      }]
    };
  }

  calculateTotals(): void {
    this.totalIncomeAmount = 0;
    this.totalExpenseAmount = 0;
    
    this.transactions.forEach(trans => {
      if (trans.category?.type === 'income') {
        this.totalIncomeAmount += trans.amount;
      } else if (trans.category?.type === 'expense') {
        this.totalExpenseAmount += trans.amount;
      }
    });
    
    this.totalBalanceAmount = this.totalIncomeAmount - this.totalExpenseAmount;
  }

  openAddTransactionModal(): void {
    const transaction = {
      _id: null as any,
      category: { name: '', type: '' },
      date: new Date(),
      displayDate: {},
      paymentMode: 0,
      amount: null as any,
      displayAmount: '',
      note: '',
    };
    
    this.dialog.open(AddTransactionComponent, {
      width: '550px',
      maxWidth: '95vw',
      data: { transaction, isEdit: false },
    });
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  ngOnDestroy(): void {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }
}
