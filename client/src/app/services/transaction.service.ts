import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { config } from '../configuration/config';
import { Transaction } from 'src/app/models/Transaction';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  constructor(private http: HttpClient) {}

  getTransations() {
    return this.http.get(config.apiBaseUrl + config.urls.getTransactions);
  }

  newTransaction(transaction: Transaction) {
    return this.http.post(
      config.apiBaseUrl + config.urls.newTransaction,
      transaction
    );
  }

  deleteTransaction(transaction: Transaction) {
    return this.http.post(
      config.apiBaseUrl + config.urls.deleteTransaction,
      transaction
    );
  }
}
