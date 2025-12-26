import { Component, Inject, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, Form } from '@angular/forms';

import { Transaction } from '../../../models/Transaction';
import { TransactionService } from 'src/app/services/transaction.service';
import { ErrorHandlerComponent } from '../../error-handler/error-handler.component';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MessageService } from 'src/app/services/message.service';
import { SharedService } from 'src/app/services/shared.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { TransactionParserService, ParsedTransaction, SpeechResult } from 'src/app/services/transaction-parser.service';
import { Subscription } from 'rxjs';
import { Category } from '../../../models/Category';

@Component({
  selector: 'app-add-transaction',
  templateUrl: './add-transaction.component.html',
  styleUrls: ['./add-transaction.component.scss'],
})
export class AddTransactionComponent implements OnInit, OnDestroy {
  messageSubscription: Subscription;
  constructor(
    private transactionService: TransactionService,
    private dialogRef: MatDialogRef<AddTransactionComponent>,
    private dialog: MatDialog,
    private messageService: MessageService,
    private sharedService: SharedService,
    private snackbar: SnackbarService,
    private parserService: TransactionParserService,
    private cdr: ChangeDetectorRef,
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
  isEditTransaction: boolean = false;
  addTransactionForm!: FormGroup;
  paymentModesList: any;
  transactionDetails: Transaction | null = null;
  
  // Voice input properties
  isListening = false;
  voiceInput = '';
  liveTranscript = ''; // For real-time transcription
  parsedResults: ParsedTransaction | null = null;
  showParsedResults = false;
  listeningTimeout: any;

  ngOnInit(): void {
    this.categories = this.sharedService.getItemFromLocalStorage('categories');

    this.addTransactionForm = new FormGroup({
      _id: new FormControl<string | null>(null),
      category: new FormControl<any>(null),
      amount: new FormControl<number | null>(null, Validators.required),
      date: new FormControl<Date | string>(new Date(), Validators.required),
      paymentMode: new FormControl<any>(null),
      note: new FormControl<string | null>(null),
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
    let transDate = this.addTransactionForm.get('date')!.value as Date;
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

  // Voice input methods
  startVoiceInput() {
    if (!this.parserService.isSpeechRecognitionSupported()) {
      this.snackbar.error('Speech recognition not supported in this browser');
      return;
    }

    // Clear all form fields before starting new voice input
    this.clearFormFields();

    this.isListening = true;
    this.voiceInput = '';
    this.liveTranscript = '';
    this.parsedResults = null;
    this.showParsedResults = false;

    // Set a longer timeout to automatically stop listening after 60 seconds
    this.listeningTimeout = setTimeout(() => {
      this.stopVoiceInput();
      this.snackbar.warning('Voice input timed out after 60 seconds');
    }, 60000);

    this.parserService.startListening()
      .subscribe({
        next: (result: SpeechResult) => {
          if (result.isFinal) {
            // Final result - store transcript but don't auto-process
            this.voiceInput = result.transcript;
            this.liveTranscript = result.transcript; // Keep showing the final transcript
            
            // Parse the transcript but don't apply to form yet
            this.parsedResults = this.parserService.parseTransactionText(result.transcript, this.categories, this.paymentModesList);
            
            // Don't auto-apply - wait for user to manually stop
          } else {
            // Interim result - show live transcription
            this.liveTranscript = result.transcript;
            this.cdr.detectChanges(); // Ensure UI updates
          }
        },
        error: (error) => {
          console.error('Speech recognition error in component:', error); // Debug
          this.clearListeningState();
          this.snackbar.error('Voice recognition failed. Please try again.');
        }
      });
  }

  private clearFormFields() {
    // Reset form to initial state, keeping only the date as today's date
    this.addTransactionForm.patchValue({
      category: null,
      amount: null,
      paymentMode: null,
      note: null
    });

    // Clear any validation states
    Object.keys(this.addTransactionForm.controls).forEach(key => {
      const control = this.addTransactionForm.get(key);
      if (control) {
        control.markAsUntouched();
        control.markAsPristine();
      }
    });

    // Trigger change detection
    this.cdr.detectChanges();
  }

  stopVoiceInput() {
    this.parserService.stopListening();
    
    // Process the voice input only when user manually stops
    if (this.parsedResults && this.voiceInput) {
      this.autoApplyToForm();
    } else if (this.voiceInput) {
      // If we have voice input but no parsed results, try to parse again
      this.parsedResults = this.parserService.parseTransactionText(this.voiceInput, this.categories, this.paymentModesList);
      this.autoApplyToForm();
    }
    
    this.clearListeningState();
  }

  private clearListeningState() {
    this.isListening = false;
    this.liveTranscript = '';
    if (this.listeningTimeout) {
      clearTimeout(this.listeningTimeout);
      this.listeningTimeout = null;
    }
  }

  autoApplyToForm() {
    if (!this.parsedResults) {
      return;
    }

    const formUpdate: any = {};
    let appliedFields: string[] = [];

    // Apply each field with individual error handling
    this.applyAmountSafely(formUpdate, appliedFields);
    this.applyCategorySafely(formUpdate, appliedFields);
    this.applyDateSafely(formUpdate, appliedFields);
    this.applyNoteSafely(formUpdate, appliedFields);
    this.applyPaymentModeSafely(formUpdate, appliedFields);

    try {
      // Apply the values to the form
      this.addTransactionForm.patchValue(formUpdate);
      
      // Mark form fields as touched to trigger label floating and validation display
      Object.keys(formUpdate).forEach(key => {
        const control = this.addTransactionForm.get(key);
        if (control) {
          control.markAsTouched();
          control.updateValueAndValidity();
        }
      });

      // Force change detection to update the UI
      this.cdr.detectChanges();
      
      // Small delay to ensure form fields are properly updated
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);

      // Show success message with applied fields
      if (appliedFields.length > 0) {
        this.snackbar.success(`Applied: ${appliedFields.join(', ')} from voice input`);
      } else {
        this.snackbar.warning('Could not extract transaction details from voice input');
      }
    } catch (error) {
      console.error('Error applying form updates:', error);
      // Even if form update fails, show what was parsed
      if (appliedFields.length > 0) {
        this.snackbar.warning(`Recognized ${appliedFields.join(', ')}, but failed to apply to form`);
      } else {
        this.snackbar.error('Failed to process voice input');
      }
    }
  }

  private applyAmountSafely(formUpdate: any, appliedFields: string[]) {
    try {
      if (this.parsedResults?.amount) {
        formUpdate.amount = this.parsedResults.amount;
        appliedFields.push('Amount');
      }
    } catch (error) {
      console.error('Error applying amount:', error);
    }
  }

  private applyCategorySafely(formUpdate: any, appliedFields: string[]) {
    try {
      if (this.parsedResults?.category) {
        // Find the actual category object by name
        const matchedCategory = this.categories.find(cat => 
          cat.name.toLowerCase() === this.parsedResults!.category!.toLowerCase()
        );
        if (matchedCategory) {
          formUpdate.category = matchedCategory;
          appliedFields.push('Category');
        }
      }
    } catch (error) {
      console.error('Error applying category:', error);
    }
  }

  private applyDateSafely(formUpdate: any, appliedFields: string[]) {
    try {
      if (this.parsedResults?.date) {
        formUpdate.date = this.parsedResults.date;
        appliedFields.push('Date');
      }
    } catch (error) {
      console.error('Error applying date:', error);
    }
  }

  private applyNoteSafely(formUpdate: any, appliedFields: string[]) {
    try {
      if (this.parsedResults?.note) {
        formUpdate.note = this.parsedResults.note;
        appliedFields.push('Note');
      }
    } catch (error) {
      console.error('Error applying note:', error);
    }
  }

  private applyPaymentModeSafely(formUpdate: any, appliedFields: string[]) {
    try {
      if (this.parsedResults?.paymentMode) {
        const searchTerm = this.parsedResults.paymentMode.toLowerCase();
        const matchedPaymentMode = this.paymentModesList?.find((mode: any) => {
          // Check name match (string comparison)
          const nameMatch = mode.name && typeof mode.name === 'string' && 
                           mode.name.toLowerCase() === searchTerm;
          
          // Check type match (convert number to string for comparison)
          const typeMatch = mode.type && 
                           mode.type.toString().toLowerCase() === searchTerm;
          
          return nameMatch || typeMatch;
        });
        
        if (matchedPaymentMode) {
          formUpdate.paymentMode = matchedPaymentMode.type;
          appliedFields.push('Payment Mode');
        }
      }
    } catch (error) {
      console.error('Error applying payment mode:', error);
    }
  }

  ngOnDestroy() {
    this.clearListeningState();
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }

}
