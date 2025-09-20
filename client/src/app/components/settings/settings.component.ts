import {
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FileSaverService } from 'ngx-filesaver';

import { SnackbarService } from 'src/app/services/snackbar.service';
import { Category } from '../../models/Category';
import { PaymentMode } from '../../models/PaymentMode';
import { Settings } from '../../models/Settings';
import { MessageService } from 'src/app/services/message.service';
import { SettingsService } from 'src/app/services/settings.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  constructor(
    private settingsService: SettingsService,
    private sharedService: SharedService,
    private snackbar: SnackbarService,
    private modalService: BsModalService,
    private fileSaverService: FileSaverService,
    private messageService: MessageService
  ) {
    this.currentSettings = {
      currency: null as any,
      darkMode: false,
      theme: 'blue'
    };
  }

  currencyList: any[] = [];
  categoryList: any[] = [];
  paymentModesList: any[] = [];
  currentUser!: any;
  currentSettings: Settings;
  categoryIconPaths = [
    'assets/images/categories/vacation.png',
    'assets/images/categories/balloons.png',
    'assets/images/categories/bills.png',
    'assets/images/categories/books.png',
    'assets/images/categories/cake.png',
    'assets/images/categories/calendar.png',
    'assets/images/categories/car.png',
    'assets/images/categories/cashback.png',
    'assets/images/categories/computer.png',
    'assets/images/categories/cosmetics.png',
    'assets/images/categories/credit.png',
    'assets/images/categories/diet.png',
    'assets/images/categories/education.png',
    'assets/images/categories/emergency-call.png',
    'assets/images/categories/entertainment.png',
    'assets/images/categories/fitness.png',
    'assets/images/categories/food-delivery.png',
    'assets/images/categories/food.png',
    'assets/images/categories/fruit.png',
    'assets/images/categories/fuel.png',
    'assets/images/categories/giftbox.png',
    'assets/images/categories/graduation-hat.png',
    'assets/images/categories/grocery.png',
    'assets/images/categories/hamburger.png',
    'assets/images/categories/health-insurance.png',
    'assets/images/categories/healthcare.png',
    'assets/images/categories/home.png',
    'assets/images/categories/hospital-building.png',
    'assets/images/categories/insurance.png',
    'assets/images/categories/investing.png',
    'assets/images/categories/investment.png',
    'assets/images/categories/lotus.png',
    'assets/images/categories/other_income.png',
    'assets/images/categories/party.png',
    'assets/images/categories/pets-allowed.png',
    'assets/images/categories/pets.png',
    'assets/images/categories/pizza.png',
    'assets/images/categories/plane.png',
    'assets/images/categories/repairs.png',
    'assets/images/categories/salary.png',
    'assets/images/categories/shopping.png',
    'assets/images/categories/smart-tv.png',
    'assets/images/categories/smartphone.png',
    'assets/images/categories/social-media.png',
    'assets/images/categories/train.png',
    'assets/images/categories/transportation.png',
    'assets/images/categories/trekking.png',
    'assets/images/categories/vacation.png',
    'assets/images/categories/vegetables.png',
    'assets/images/categories/atm-machine.png',
    'assets/images/categories/bankruptcy.png',
    'assets/images/categories/bonus.png',
    'assets/images/categories/cab.png',
    'assets/images/categories/capsules.png',
    'assets/images/categories/cash-money.png',
    'assets/images/categories/commerce.png',
    'assets/images/categories/gas-pump.png',
    'assets/images/categories/gas.png',
    'assets/images/categories/income.png',
    'assets/images/categories/house.png',
    'assets/images/categories/money.png',
    'assets/images/categories/milk.png',
    'assets/images/categories/netflix.png',
    'assets/images/categories/purse.png',
    'assets/images/categories/popcorn.png',
    'assets/images/categories/subscription.png',
    'assets/images/categories/sunglasses.png',
    'assets/images/categories/taxes.png',
    'assets/images/categories/trash-bin.png',
    'assets/images/categories/wallet.png',
    'assets/images/categories/vehicle.png',
  ];
  paymentIconPaths = [
    'assets/images/paymentModes/bank.png',
    'assets/images/paymentModes/bank2.png',
    'assets/images/paymentModes/card.png',
    'assets/images/paymentModes/card1.png',
    'assets/images/paymentModes/card2.png',
    'assets/images/paymentModes/card3.png',
    'assets/images/paymentModes/card4.png',
    'assets/images/paymentModes/cash.png',
    'assets/images/paymentModes/cash1.png',
    'assets/images/paymentModes/cash2.png',
    'assets/images/paymentModes/cashless.png',
    'assets/images/paymentModes/cheque.png',
    'assets/images/paymentModes/cheque1.png',
    'assets/images/paymentModes/invoice.png',
    'assets/images/paymentModes/mobile-wallet.png',
    'assets/images/paymentModes/wallet.png',
  ]
  searchCurrency: string = '';

  // Theme options for the theme selector
  themeOptions = [
    { name: 'Blue', value: 'blue', primaryColor: '#2196F3' },
    { name: 'Green', value: 'green', primaryColor: '#4CAF50' },
    { name: 'Purple', value: 'purple', primaryColor: '#9C27B0' },
    { name: 'Orange', value: 'orange', primaryColor: '#FF9800' },
    { name: 'Red', value: 'red', primaryColor: '#F44336' },
    { name: 'Teal', value: 'teal', primaryColor: '#009688' },
    { name: 'Indigo', value: 'indigo', primaryColor: '#3F51B5' },
    { name: 'Pink', value: 'pink', primaryColor: '#E91E63' },
  ];

  editCategory: boolean = false;
  editPaymentMode: boolean = false;
  confirmUploadmodalRef!: BsModalRef;
  @ViewChild('filePicker') filePicker!: ElementRef<HTMLElement>;

  addCategoryForm = new UntypedFormGroup({
    _id: new UntypedFormControl(null),
    name: new UntypedFormControl(null, Validators.required),
    type: new UntypedFormControl(null, Validators.required),
    icon: new UntypedFormControl(null),
    user: new UntypedFormControl(null),
  });

  addPaymentModeForm = new UntypedFormGroup({
    _id: new UntypedFormControl(null),
    name: new UntypedFormControl(null, Validators.required),
    type: new UntypedFormControl(null),
    icon: new UntypedFormControl(null),
    user: new UntypedFormControl(null),
  });

  ngOnInit() {
    this.getSettings(); // This will now handle theme initialization
    this.getCurrencies();
    this.fetchCategoryList();
    this.fetchPaymentModeList();

    this.currentUser =
      this.sharedService.getItemFromLocalStorage('current_user');
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('selectedTheme') || 'orange';
    this.applyTheme(savedTheme);
  }

  fetchCategoryList() {
    this.categoryList =
      this.sharedService.getItemFromLocalStorage('categories');
  }

  getSettings() {
    this.settingsService.getSettings().subscribe((res) => {
      let response = res as any;
      if (response && response.data && response.data.length) {
        this.currentSettings = response.data[0];
        // Set default theme if not present
        if (!this.currentSettings.theme) {
          this.currentSettings.theme = 'orange';
        }

        // Apply the theme from database and sync with localStorage
        this.applyTheme(this.currentSettings.theme);
        localStorage.setItem('selectedTheme', this.currentSettings.theme);

        // Apply dark mode setting
        this.applyDarkMode(this.currentSettings.darkMode);

        // Notify app component about theme change
        this.messageService.sendMessage(`apply-theme:${this.currentSettings.theme}`);
      } else {
        // No settings found, trigger fallback theme initialization
        this.messageService.sendMessage('initialize-theme-fallback');
      }
    }, (error) => {
      // API error, trigger fallback theme initialization
      this.messageService.sendMessage('initialize-theme-fallback');
    });
  }

  getCurrencies() {
    if (
      typeof this.currencyList !== 'undefined' &&
      this.currencyList.length === 0
    ) {
      this.settingsService.getCurrencies().subscribe(
        (res) => {
          let response = res as any;
          this.currencyList = response.data;
        },
        (err) => {
          this.snackbar.error('Failed to fetch currencies');
        }
      );
    }
  }

  compareWith(currency: any, selectedCurrency: any) {
    return (
      currency && selectedCurrency && currency.name === selectedCurrency.name
    );
  }

  updateSettings() {
    this.settingsService
      .updateSettings(this.currentSettings)
      .subscribe((res) => {
        this.snackbar.success('Settings have been updated');
        // Don't fetch settings here since we should have fresh data already
      });
  }

  onThemeChange(event: any) {
    const selectedTheme = event.value;
    console.log('Theme changed to:', selectedTheme);

    // Update the theme in current settings
    this.currentSettings.theme = selectedTheme;

    // Apply theme immediately by changing body class
    this.applyTheme(selectedTheme);
  }

  onDarkModeToggle(event: any) {
    const isDarkMode = event.checked; // mat-slide-toggle uses checked property
    console.log('Dark mode toggled to:', isDarkMode);

    // Update the dark mode setting
    this.currentSettings.darkMode = isDarkMode;

    // Apply dark mode immediately
    this.applyDarkMode(isDarkMode);

    // Send message to notify other components
    if (isDarkMode) {
      this.messageService.sendMessage('darkMode');
    } else {
      this.messageService.sendMessage('lightMode');
    }

    // Note: Settings are saved when user clicks "Save Changes" button
  }

  private applyDarkMode(isDarkMode: boolean): void {
    if (isDarkMode) {
      document.body.classList.add('darkMode');
    } else {
      document.body.classList.remove('darkMode');
    }
  }

  private applyTheme(themeName: string): void {
    const availableThemes = ['blue', 'green', 'purple', 'orange', 'red', 'teal', 'indigo', 'pink'];

    // Remove existing theme classes
    availableThemes.forEach(theme => {
      document.body.classList.remove(`theme-${theme}`);
    });

    // Add new theme class
    document.body.classList.add(`theme-${themeName}`);

    // Save to localStorage
    localStorage.setItem('selectedTheme', themeName);
  }

  browseFile() {
    let el: HTMLElement = this.filePicker.nativeElement;
    el.click();
    this.closeModal();
  }

  uploadSpreadsheet(event: Event) {
    this.messageService.setIsLoading(true);
    const file = (event.target as HTMLInputElement).files![0];

    if (file) {
      const postData = new FormData();
      postData.append('spreadsheet', file);
      this.settingsService.uploadSpreadsheet(postData).subscribe(
        (res) => {
          this.snackbar.success(
            'Spreadsheet data successfully added'
          );
          this.messageService.setIsLoading(false);
        },
        (err) => {
          this.messageService.setIsLoading(false);
          this.snackbar.error('Failed to process spreadsheet data');
        }
      );
    }
  }

  downloadSpreadsheet() {
    this.settingsService.downloadSpreadsheet().subscribe(
      (res) => {
        this.fileSaverService.save(res, 'BudgetManager.xlsx');
        this.snackbar.success('Download spreadsheet successful');
      },
      (err) => {
        this.snackbar.error('Failed to download spreadsheet');
      }
    );
  }

  deleteTransactions() {
    if (confirm('Are you sure you want to delete all transactions?')) {
      if (this.currentUser) {
        this.settingsService.deleteTransactions(this.currentUser).subscribe(
          () => {
            this.snackbar.success(
              'Transactions deleted successfully'
            );
          },
          (err) => {
            this.snackbar.error('Failed to delete transactions');
          }
        );
      } else {
        this.snackbar.error('Invalid user');
      }
    }
  }

  addCategory() {
    if (this.addCategoryForm.valid) {
      const formValue: any = this.addCategoryForm.getRawValue();
      this.settingsService
        .addCategory(formValue)
        .subscribe((res) => {
          this.snackbar.success('Category added successfully');
          this.fetchCategories();
        });

      this.closeModal();
    } else {
      this.snackbar.error('Failed to add the category');
    }
  }

  fetchCategories() {
    this.settingsService.getCategories().subscribe(
      (res) => {
        let response = res as any;
        this.sharedService.setItemToLocalStorage('categories', response.data);
        this.fetchCategoryList();
      },
      (err) => {
        this.snackbar.error('Failed to fetch transaction categories');
      }
    );
  }

  deleteCategory(category: Category) {
    if (confirm(`Are you sure you want to delete category ${category.name}?`)) {
      this.settingsService.deleteCategory(category).subscribe(
        (res) => {
          this.snackbar.success('Category deleted successfully');
          this.fetchCategories();
        },
        (err) => {
          this.snackbar.error('Failed to delete the category');
        }
      );
    }
  }

  fetchPaymentModeList() {
    this.paymentModesList =
      this.sharedService.getItemFromLocalStorage('paymentModes');
  }

  addPaymentMode() {
    const paymentModesCount = this.paymentModesList[this.paymentModesList.length - 1]?.type + 1;
    const isValidPaymentMode = this.paymentModesList.findIndex((mode: PaymentMode) => mode.type === paymentModesCount) === -1;
    if (paymentModesCount && isValidPaymentMode) {
      this.addPaymentModeForm.get('type')?.patchValue(paymentModesCount);
      if (this.addPaymentModeForm.valid) {
        const formValue: any = this.addPaymentModeForm.getRawValue();
        this.settingsService
          .addPaymentMode(formValue)
          .subscribe((res) => {
            this.snackbar.success('Payment mode added successfully');
            this.fetchPaymentModes();
          });

        this.closeModal();
      } else {
        this.snackbar.error('Failed to add the payment mode');
      }
    }
  }

  fetchPaymentModes() {
    this.settingsService.getPaymentModes().subscribe(
      (res) => {
        let response = res as any;
        this.sharedService.setItemToLocalStorage('paymentModes', response.data);
        this.fetchPaymentModeList();
      },
      (err) => {
        this.snackbar.error('Failed to fetch payment modes');
      }
    );
  }

  onDeletePaymentMode(mode: PaymentMode) {
    if (confirm(`Are you sure you want to delete category ${mode.name}?`)) {
      this.settingsService.deletePaymentMode(mode).subscribe(
        (res) => {
          this.snackbar.success('Payment mode deleted successfully');
          this.fetchPaymentModes();
        },
        (err) => {
          this.snackbar.error('Failed to delete the payment mode');
        }
      );
    }
  }

  openCategoryModal(modal: TemplateRef<any>, category?: Category) {
    this.editCategory = category ? true : false;
    this.addCategoryForm.get('_id')!.setValue(category?._id);
    this.addCategoryForm.get('name')!.setValue(category?.name);
    this.addCategoryForm.get('type')!.setValue(category?.type);
    this.addCategoryForm.get('icon')!.setValue(category?.icon);
    this.addCategoryForm.get('user')!.setValue(category?.user);
    this.confirmUploadmodalRef = this.modalService.show(modal, {
      class: 'modal-lg',
    });
  }

  openPaymentModal(modal: TemplateRef<any>, mode?: PaymentMode) {
    this.editPaymentMode = mode ? true : false;
    this.addPaymentModeForm.get('_id')!.setValue(mode?._id);
    this.addPaymentModeForm.get('name')!.setValue(mode?.name);
    this.addPaymentModeForm.get('type')!.setValue(mode?.type);
    this.addPaymentModeForm.get('icon')!.setValue(mode?.icon);
    this.addPaymentModeForm.get('user')!.setValue(mode?.user);
    this.confirmUploadmodalRef = this.modalService.show(modal, {
      class: 'modal-lg',
    });
  }

  closeModal() {
    this.confirmUploadmodalRef?.hide();
  }
}
