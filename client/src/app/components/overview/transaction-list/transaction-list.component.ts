import { Component, Input, OnInit } from '@angular/core';
import { Transaction } from 'src/app/models/transaction';

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
})
export class TransactionListComponent implements OnInit {
  constructor() {}

  @Input() transactions: Array<Transaction> = [];
  @Input() currencySymbol: string = '';

  ngOnInit(): void {}
}
