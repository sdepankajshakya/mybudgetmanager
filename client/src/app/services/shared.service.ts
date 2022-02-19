import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  constructor() {}

  today = new Date();

  now = {
    date: this.today.getDate(),
    month: this.today.getMonth() + 1,
    year: this.today.getFullYear(),
    day: this.today.getDay(),
  };

  getItemFromLocalStorage(item: string) {
    if (localStorage.getItem(item)) {
      return JSON.parse(localStorage.getItem(item) || '');
    }
  }

  setItemToLocalStorage(item: string, data: any) {
    localStorage.setItem(item, JSON.stringify(data));
  }
}
