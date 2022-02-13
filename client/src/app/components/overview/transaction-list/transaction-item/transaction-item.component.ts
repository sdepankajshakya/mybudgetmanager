import { Component, Input, OnInit } from '@angular/core';

import { MessageService } from 'src/app/services/message.service';
import { Transaction } from 'src/app/models/transaction';
import { TransactionService } from 'src/app/services/transaction.service';
import { AddTransactionComponent } from '../../add-transaction/add-transaction.component';

import { MatDialog } from '@angular/material/dialog';
import {
  ConfirmDialogComponent,
  ConfirmDialogModel,
} from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { SharedService } from 'src/app/services/shared.service';
import { SettingsService } from 'src/app/services/settings.service';

import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-transaction-item',
  templateUrl: './transaction-item.component.html',
  styleUrls: ['./transaction-item.component.scss'],
})
export class TransactionItemComponent implements OnInit {
  constructor(
    private dialog: MatDialog,
    private transactionService: TransactionService,
    private messageService: MessageService,
    private sharedService: SharedService,
    private settingsService: SettingsService,
    private toastr: ToastrService
  ) {}

  @Input() transaction: Transaction = {
    _id: '',
    category: {
      name: '',
      type: '',
    },
    date: new Date(),
    displayDate: {},
    amount: 0,
    note: '',
  };

  categories: any[] = [];

  @Input() currencySymbol: string = '';

  ngOnInit(): void {
    let categories = this.sharedService.getItemFromLocalStorage('categories');
    if (categories) {
      this.categories = categories;
    } else {
      this.getCategories();
    }
  }

  getCategories() {
    const savedCategories =
      this.sharedService.getItemFromLocalStorage('categories');
    if (!savedCategories) {
      this.settingsService.getCategories().subscribe(
        (res) => {
          let response = res as any;
          this.categories = response.data;
          this.sharedService.setItemToLocalStorage('categories', response.data);
        },
        (err) => {
          this.toastr.error('Failed to fetch transaction categories', 'Error!');
        }
      );
    }
  }

  getCategoryIcon(name: string) {
    if (name && this.categories && this.categories.length) {
      const selectedCategory = this.categories.filter(
        (category) => category.name === name
      );
      return selectedCategory[0]?.icon;
    } else {
      return '';
    }
  }

  getCategoryType(name: string) {
    if (name && this.categories && this.categories.length) {
      const selectedCategory = this.categories.filter(
        (category) => category.name === name
      );
      return selectedCategory[0]?.type;
    } else {
      return '';
    }
  }

  openAddTransactionModal() {
    this.dialog.open(AddTransactionComponent, {
      width: '550px',
      data: this.transaction,
    });
  }

  confirmDialog(): void {
    const message = `Are you sure you want delete this transaction?`;
    const dialogData = new ConfirmDialogModel('Confirm Action', message);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((dialogResult) => {
      if (dialogResult) {
        this.deleteTransaction();
      }
    });
  }

  deleteTransaction() {
    this.transactionService
      .deleteTransaction(this.transaction)
      .subscribe((res) => {
        this.messageService.sendMessage('transaction deleted');
      });
  }
}
