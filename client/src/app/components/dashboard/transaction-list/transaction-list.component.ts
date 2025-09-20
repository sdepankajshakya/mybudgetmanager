import { Component, Input, OnInit } from '@angular/core';
import { Transaction } from '../../../models/Transaction';
import { MessageService } from 'src/app/services/message.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { AddTransactionComponent } from '../add-transaction/add-transaction.component';
import { MatDialog } from '@angular/material/dialog';
import { SnackbarService } from 'src/app/services/snackbar.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogModel,
} from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { SharedService } from 'src/app/services/shared.service';
import { SettingsService } from 'src/app/services/settings.service';
import { Category } from '../../../models/Category';

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
})
export class TransactionListComponent implements OnInit {
  constructor(
    private dialog: MatDialog,
    private transactionService: TransactionService,
    private messageService: MessageService,
    private sharedService: SharedService,
    private settingsService: SettingsService,
    private snackbarService: SnackbarService
  ) {}

  @Input() transactions: Array<Transaction> = [];
  @Input() currencySymbol: string = '';
  
  categories: Category[] = [];

  ngOnInit(): void {
    this.getAllCategories();
  }

  getCategoryIcon(categoryName: string): string {
    // Get categories from localStorage via SharedService
    const categories = this.sharedService.getItemFromLocalStorage('categories') || [];
    const category = categories.find((cat: Category) => cat.name === categoryName);
    return category?.icon || '/assets/images/categories/default.png';
  }

  getAllCategories() {
    this.categories = this.sharedService.getItemFromLocalStorage('categories') || [];
  }

  openAddTransactionModal(transaction?: Transaction): void {
    const dialogRef = this.dialog.open(AddTransactionComponent, {
      panelClass: 'add-transaction-dialog',
      data: {
        transaction: transaction || null,
        isEdit: !!transaction
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Transaction was updated/added, refresh the list if needed
        this.sendMessage();
      }
    });
  }

  sendMessage(): void {
    this.messageService.sendMessage('transaction-added-updated');
  }

  confirmDialog(transaction: Transaction): void {
    const message = `Are you sure you want to delete this transaction?`;
    const dialogData = new ConfirmDialogModel('Confirm Action', message);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((dialogResult) => {
      if (dialogResult) {
        this.deleteTransaction(transaction);
      }
    });
  }

  deleteTransaction(transaction: Transaction) {
    this.transactionService.deleteTransaction(transaction).subscribe({
      next: (response) => {
        this.snackbarService.success('Transaction deleted successfully!');
        this.sendMessage();
      },
      error: (error) => {
        this.snackbarService.error('Error deleting transaction. Please try again.');
      }
    });
  }
}
