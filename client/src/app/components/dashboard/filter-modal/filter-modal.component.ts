import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface FilterData {
  transactionMonths: any[];
  transactionYears: number[];
  paymentModes: any[];
  currentFilters: {
    selectedMonth: number | null;
    selectedYear: number | null;
    paymentMode: number;
  };
}

@Component({
  selector: 'app-filter-modal',
  templateUrl: './filter-modal.component.html',
  styleUrls: ['./filter-modal.component.scss']
})
export class FilterModalComponent {
  filters: {
    selectedMonth: number | null;
    selectedYear: number | null;
    paymentMode: number;
  };

  constructor(
    public dialogRef: MatDialogRef<FilterModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FilterData
  ) {
    // Initialize with current filter values
    this.filters = { ...data.currentFilters };
  }

  applyFilters(): void {
    this.dialogRef.close(this.filters);
  }

  clearAllFilters(): void {
    this.filters = {
      selectedMonth: null,
      selectedYear: null,
      paymentMode: 0
    };
  }
}
