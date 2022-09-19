import {
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FileSaverService } from 'ngx-filesaver';

import { ToastrService } from 'ngx-toastr';
import { Category } from 'src/app/models/Category';
import { Settings } from 'src/app/models/Settings';
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
    private toastr: ToastrService,
    private modalService: BsModalService,
    private fileSaverService: FileSaverService
  ) {
    this.currentSettings = {
      currency: null as any,
      darkMode: false
    };
  }

  isLoading: boolean = false;

  currencyList: any[] = [];
  categoryList: any[] = [];
  currentUser!: any;
  currentSettings: Settings;
  iconPaths = [
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
  ];
  searchCurrency: string = '';

  editCategory: boolean = false;
  confirmUploadmodalRef!: BsModalRef;
  addCategoryModalRef!: BsModalRef;
  @ViewChild('filePicker') filePicker!: ElementRef<HTMLElement>;

  addCategoryForm = new FormGroup({
    _id: new FormControl(null),
    name: new FormControl(null, Validators.required),
    type: new FormControl(null, Validators.required),
    icon: new FormControl(null),
    user: new FormControl(null),
  });

  ngOnInit() {
    this.getSettings();
    this.getCurrencies();
    this.fetchCategoryList();

    this.currentUser =
      this.sharedService.getItemFromLocalStorage('current_user');
  }

  fetchCategoryList() {
    this.categoryList =
    this.sharedService.getItemFromLocalStorage('categories');
  }

  getSettings() {
    this.settingsService.getSettings().subscribe((res) => {
      let response = res as any;
      if (response && response.data && response.data.length) this.currentSettings = response.data[0];
      
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
          this.toastr.error('Failed to fetch currencies', 'Error!');
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
        this.getSettings();
        this.toastr.success('Settings have been updated', 'Success!');
      });
  }

  browseFile() {
    let el: HTMLElement = this.filePicker.nativeElement;
    el.click();
    this.closeModal();
  }

  uploadSpreadsheet(event: Event) {
    this.isLoading = true;
    const file = (event.target as HTMLInputElement).files![0];

    if (file) {
      const postData = new FormData();
      postData.append('spreadsheet', file);
      this.settingsService.uploadSpreadsheet(postData).subscribe(
        (res) => {
          this.toastr.success(
            'Spreadsheet data successfully added',
            'Success!'
          );
          this.isLoading = false;
        },
        (err) => {
          this.isLoading = false;
          this.toastr.error('Failed to process spreadsheet data', 'Error!');
        }
      );
    }
  }

  downloadSpreadsheet() {
    this.settingsService.downloadSpreadsheet().subscribe(
      (res) => {
        this.fileSaverService.save(res, 'BudgetManager.xlsx');
        this.toastr.success('Download spreadsheet successful', 'Success!');
      },
      (err) => {
        this.toastr.error('Failed to download spreadsheet', 'Error!');
      }
    );
  }

  deleteTransactions() {
    if (confirm('Are you sure you want to delete all transactions?')) {
      if (this.currentUser) {
        this.settingsService.deleteTransactions(this.currentUser).subscribe(
          () => {
            this.toastr.success(
              'Transactions deleted successfully',
              'Success!'
            );
          },
          (err) => {
            this.toastr.error('Failed to delete transactions', 'Error!');
          }
        );
      } else {
        this.toastr.error('Invalid user', 'Error!');
      }
    }
  }

  addCategory() {
    if (this.addCategoryForm.valid) {
      this.settingsService
        .addCategory(this.addCategoryForm.value)
        .subscribe((res) => {
          this.toastr.success('Category added successfully', 'Success!');
          this.fetchCategories();
        });

      this.closeModal();
    } else {
      this.toastr.error('Failed to add the category', 'Error! Invalid fields');
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
        this.toastr.error('Failed to fetch transaction categories', 'Error!');
      }
    );
  }

  deleteCategory(category: Category) {
    this.settingsService.deleteCategory(category).subscribe(
      (res) => {
        this.toastr.success('Category deleted successfully', 'Success!');
        this.fetchCategories();
      },
      (err) => {
        this.toastr.error('Failed to delete the category', 'Error!');
      }
    );
  }

  openModal(modal: TemplateRef<any>, category?: Category) {
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

  closeModal() {
    this.confirmUploadmodalRef?.hide();
    this.addCategoryModalRef?.hide();
  }
}
