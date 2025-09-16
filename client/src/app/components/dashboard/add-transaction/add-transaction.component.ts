import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators, Form } from '@angular/forms';

import { Transaction } from 'src/app/models/Transaction';
import { TransactionService } from 'src/app/services/transaction.service';
import { ErrorHandlerComponent } from '../../error-handler/error-handler.component';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MessageService } from 'src/app/services/message.service';
import { SharedService } from 'src/app/services/shared.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { Subscription } from 'rxjs';
import { Category } from 'src/app/models/Category';

@Component({
  selector: 'app-add-transaction',
  templateUrl: './add-transaction.component.html',
  styleUrls: ['./add-transaction.component.scss'],
})
export class AddTransactionComponent implements OnInit {
  messageSubscription: Subscription;
  constructor(
    private transactionService: TransactionService,
    private dialogRef: MatDialogRef<AddTransactionComponent>,
    private dialog: MatDialog,
    private messageService: MessageService,
    private sharedService: SharedService,
    private snackbar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) private data: { transaction: Transaction, isEdit: boolean }
  ) {
    this.messageSubscription = this.messageService
      .getMessage()
      .subscribe((message) => {
        if (message.text === 'edit a transaction') {
          this.isEditTransaction = true;
        }
      });
    
    // Set edit mode based on injected data
    this.isEditTransaction = this.data?.isEdit || false;
    this.transactionDetails = this.data?.transaction || null;
  }

  categories: Category[] = [];
  mostUsedCategories: Category[] = [];
  isEditTransaction: boolean = false;
  addTransactionForm: any;
  paymentModesList: any;
  transactionDetails: Transaction | null = null;

  ngOnInit(): void {
    this.categories = this.sharedService.getItemFromLocalStorage('categories');
    const mostUsedCategoryNames = this.sharedService.getItemFromLocalStorage('mostUsedCategories');

    if (this.categories?.length && mostUsedCategoryNames?.length) {
      this.categories.forEach(category => {
        if (mostUsedCategoryNames.includes(category.name)) {
          this.mostUsedCategories.push(category);
        }
      });
    }

    this.addTransactionForm = new UntypedFormGroup({
      _id: new UntypedFormControl(null),
      category: new UntypedFormControl(null),
      amount: new UntypedFormControl(null, Validators.required),
      date: new UntypedFormControl(new Date(), Validators.required),
      paymentMode: new UntypedFormControl(null),
      note: new UntypedFormControl(null),
    });
    
    if (this.transactionDetails) {
      const { _id, category, amount, date, note, paymentMode } = this.transactionDetails;
      this.addTransactionForm.patchValue({
        _id,
        category,
        amount,
        date,
        paymentMode,
        note,
      });
    }

    this.fetchPaymentModeList();
  }

  compareWith(category: any, selectedCategory: any) {
    return (
      category && selectedCategory && category.name === selectedCategory.name
    );
  }

  comparePaymentModeWith(paymentMode: any, selectedPaymentMode: any) {
    return (
      paymentMode && selectedPaymentMode && paymentMode.name === selectedPaymentMode.name
    );
  }

  setCategory(category: Category) {
    this.addTransactionForm.get('category').patchValue(category);
  }

  addTransaction() {
    if (this.addTransactionForm.invalid) {
      this.dialog.open(ErrorHandlerComponent, {
        data: { message: 'Invalid fields' },
      });
      return;
    }

    if (!this.isEditTransaction) {
      this.newTransaction();
    } else {
      this.editTransaction();
    }
  }

  newTransaction() {
    let transDate = this.addTransactionForm.get('date')!.value;
    // converting single digit date and month to double digits because fullCalendar accepts 2 digits
    let date = ('0' + transDate.getDate()).slice(-2);
    let month = ('0' + (transDate.getMonth() + 1)).slice(-2);
    let year = transDate.getFullYear();
    this.addTransactionForm
      .get('date')!
      .patchValue(year + '-' + month + '-' + date); // ISO Format (yyyy-mm-dd)

    this.saveTransaction();
  }

  editTransaction() {
    let transDate = this.addTransactionForm.get('date')!.value;
    if (transDate instanceof Date) {
      this.newTransaction();
    } else {
      this.saveTransaction();
    }
  }

  saveTransaction() {
    this.transactionService
      .newTransaction(this.addTransactionForm.value)
      .subscribe(
        (res) => {
          this.dialogRef.close();
          this.messageService.sendMessage('transaction saved');
          this.snackbar.success('Transaction added successfully');
        },
        (err) => {
          this.snackbar.error('Failed to add the transaction');
        }
      );
  }

  fetchPaymentModeList() {
    this.paymentModesList =
    this.sharedService.getItemFromLocalStorage('paymentModes');
  }

}
