import {
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';

import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { ToastrService } from 'ngx-toastr';
import { Settings } from 'src/app/models/Settings';
import { User } from 'src/app/models/User';
import { SettingsService } from 'src/app/services/settings.service';
import { SharedService } from 'src/app/services/shared.service';
import { TransactionService } from 'src/app/services/transaction.service';

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
    private transactionService: TransactionService
  ) {}

  isLoading: boolean = false;

  currencyList: any[] = [];
  categoryList: any[] = [];
  currencyCtrl = new FormControl();
  categoryCtrl = new FormControl();
  currentUser!: User;
  currentSettings!: Settings;

  confirmUploadmodalRef!: BsModalRef;
  @ViewChild('filePicker') filePicker!: ElementRef<HTMLElement>;

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

  openAddCategoryModal() {}

  deleteCategoryModal() {}

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

  openModal(modal: TemplateRef<any>) {
    this.confirmUploadmodalRef = this.modalService.show(modal, {
      class: 'modal-lg',
    });
  }

  closeModal() {
    this.confirmUploadmodalRef?.hide();
  }
}
