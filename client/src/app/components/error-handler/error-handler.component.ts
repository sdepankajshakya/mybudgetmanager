import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-error-handler',
  templateUrl: './error-handler.component.html',
  styleUrls: ['./error-handler.component.scss'],
})
export class ErrorHandlerComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.message = data.message;
  }

  message = '';

  ngOnInit(): void {}
}
