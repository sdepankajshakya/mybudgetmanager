import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { config } from '../configuration/config';
import { Transaction } from '../models/Transaction';
import { map } from 'rxjs/operators';
import { SharedService } from './shared.service';
import { formatNumber } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  constructor(private http: HttpClient, private sharedService: SharedService) {}

  getTransactionsDateRange() {
    return this.http.get(config.apiBaseUrl + config.urls.getTransactionsDateRange).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  getTransations() {
    return this.http.get(config.apiBaseUrl + config.urls.getTransactions).pipe(
      map((res: any) => {
        let transactions = <Transaction[]>res?.data;
        transactions?.map(trans => {
          trans.displayDate = this.sharedService.setDate(trans.date);
          const userLocale = this.sharedService.getItemFromLocalStorage('userLocale') || 'en-IN';
          trans.displayAmount = formatNumber(trans.amount, userLocale);
          return trans;
        });

        let sortedTransactions = transactions.sort((d1: any, d2: any) => new Date(d2.date).getTime() - new Date(d1.date).getTime());
        return sortedTransactions;
      })
    );
  }

  getFilteredTransactions(filterParams: any) {
    let params = new HttpParams();
    
    // Iterate over the params object and append to HttpParams if the value is not null or undefined
    Object.keys(filterParams).forEach(key => {
      if (filterParams[key] !== null && filterParams[key] !== undefined) {
        params = params.set(key, filterParams[key].toString());
      }
    });
    
    return this.http.get(config.apiBaseUrl + config.urls.getFilteredTransactions, { params }).pipe(
      map((res: any) => {
        let transactions = <Transaction[]>res?.data;
        transactions?.map(trans => {
          trans.displayDate = this.sharedService.setDate(trans.date);
          const userLocale = this.sharedService.getItemFromLocalStorage('userLocale') || 'en-IN';
          trans.displayAmount = formatNumber(trans.amount, userLocale);
          return trans;
        });

        let sortedTransactions = transactions.sort((d1: any, d2: any) => new Date(d2.date).getTime() - new Date(d1.date).getTime());
        return sortedTransactions;
      })
    );
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
