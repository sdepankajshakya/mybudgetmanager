import {
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { ToastrService } from 'ngx-toastr';
import { User } from 'src/app/models/User';
import { Settings } from 'src/app/models/Settings';
import { SettingsService } from 'src/app/services/settings.service';
import { SharedService } from 'src/app/services/shared.service';
import { Icon } from 'src/app/models/Icon';

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
    private modalService: BsModalService
  ) {}

  isLoading: boolean = false;

  currencyList: any[] = [];
  categoryList: any[] = [];
  currencyCtrl = new FormControl();
  categoryCtrl = new FormControl();
  currentUser!: User;
  currentSettings!: Settings;
  icons: Icon[] = [
    {
      name: "Bills",
      type: "expense",
      path: "assets/images/categories/bills.png",
    },
    {
      name: "Cosmetics",
      type: "expense",
      path: "assets/images/categories/cosmetics.png",
    },
    {
      name: "Education",
      type: "expense",
      path: "assets/images/categories/education.png",
    },
    {
      name: "Entertainment",
      type: "expense",
      path: "assets/images/categories/entertainment.png",
    },
    {
      name: "Fitness",
      type: "expense",
      path: "assets/images/categories/fitness.png",
    },
    {
      name: "Food",
      type: "expense",
      path: "assets/images/categories/food.png",
    },
    {
      name: "Fuel",
      type: "expense",
      path: "assets/images/categories/fuel.png",
    },
    {
      name: "Grocery",
      type: "expense",
      path: "assets/images/categories/grocery.png",
    },
    {
      name: "HealthCare",
      type: "expense",
      path: "assets/images/categories/healthcare.png",
    },
    {
      name: "Home",
      type: "expense",
      path: "assets/images/categories/home.png",
    },
    {
      name: "Insurance",
      type: "expense",
      path: "assets/images/categories/insurance.png",
    },
    {
      name: "Investment",
      type: "expense",
      path: "assets/images/categories/investment.png",
    },
    {
      name: "Other Income",
      type: "income",
      path: "assets/images/categories/other_income.png",
    },
    {
      name: "Party",
      type: "expense",
      path: "assets/images/categories/party.png",
    },
    {
      name: "Pets",
      type: "expense",
      path: "assets/images/categories/pets.png",
    },
    {
      name: "Repairs",
      type: "expense",
      path: "assets/images/categories/repairs.png",
    },
    {
      name: "Salary",
      type: "income",
      path: "assets/images/categories/salary.png",
    },
    {
      name: "Shopping",
      type: "expense",
      path: "assets/images/categories/shopping.png",
    },
    {
      name: "Transportation",
      type: "expense",
      path: "assets/images/categories/transportation.png",
    },
    {
      name: "Vacation",
      type: "expense",
      path: "assets/images/categories/vacation.png",
    },
  ]

  confirmUploadmodalRef!: BsModalRef;
  addCategoryModalRef!: BsModalRef;
  @ViewChild('filePicker') filePicker!: ElementRef<HTMLElement>;

  addCategoryForm = new FormGroup({
    name: new FormControl(null, Validators.required),
    type: new FormControl(null, Validators.required),
    path: new FormControl(null),
  });

  ngOnInit() {
    this.getSettings();
    this.getCurrencies();

    this.categoryList =
      this.sharedService.getItemFromLocalStorage('categories');

    this.currentUser =
      this.sharedService.getItemFromLocalStorage('current_user');
  }

  getSettings() {
    this.settingsService.getSettings().subscribe((res) => {
      let response = res as any;
      if (response && response.data && response.data.length) {
        this.currentSettings = response.data[0];
      }
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

  }

  openModal(modal: TemplateRef<any>) {
    this.confirmUploadmodalRef = this.modalService.show(modal, {
      class: 'modal-lg',
    });
  }

  closeModal() {
    this.confirmUploadmodalRef?.hide();
    this.addCategoryModalRef?.hide();
  }
}
