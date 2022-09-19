import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, Form } from '@angular/forms';

import { Transaction } from 'src/app/models/Transaction';
import { TransactionService } from 'src/app/services/transaction.service';
import { ErrorHandlerComponent } from '../../error-handler/error-handler.component';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MessageService } from 'src/app/services/message.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SharedService } from 'src/app/services/shared.service';
import { ToastrService } from 'ngx-toastr';
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
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) private transactionDetails: Transaction
  ) {
    this.messageSubscription = this.messageService
      .getMessage()
      .subscribe((message) => {
        if (message.text === 'edit a transaction') {
          this.isEditTransaction = true;
        }
      });
  }

  categories: Category[] = [];
  mostUsedCategories: Category[] = [];
  isEditTransaction: boolean = false;
  addTransactionForm: any;

  ngOnInit(): void {
    this.categories = this.sharedService.getItemFromLocalStorage('categories');
    const mostUsedCategoryNames = this.sharedService.getItemFromLocalStorage('mostUsedCategories');

    if (this.categories?.length) {
      this.categories.forEach(category => {
        if (mostUsedCategoryNames.includes(category.name)) {
          this.mostUsedCategories.push(category);
        }
      });
    }

    this.addTransactionForm = new FormGroup({
      _id: new FormControl(null),
      category: new FormControl(null),
      amount: new FormControl(null, Validators.required),
      date: new FormControl(new Date(), Validators.required),
      note: new FormControl(null),
    });
    
    if (this.transactionDetails) {
      const { _id, category, amount, date, note } = this.transactionDetails;
      this.addTransactionForm.patchValue({
        _id,
        category,
        amount,
        date,
        note,
      });
    }
  }

  compareWith(category: any, selectedCategory: any) {
    return (
      category && selectedCategory && category.name === selectedCategory.name
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
          this.toastr.success('Transaction added successfully', 'Success!');
        },
        (err) => {
          this.toastr.error('Failed to add the transaction', 'Error!');
        }
      );
  }
}
