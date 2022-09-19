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

  getTopValues(obj: any, numOfValues = 1) {
    let max: any = {};

    if (numOfValues > Object.keys(obj).length) {
      return false;
    }

    Object.keys(obj).sort((a, b) => obj[b] - obj[a]).forEach((key, ind) => {
      if (ind < numOfValues) {
        max[key] = obj[key];
      }
    });
    return max;
  }
}
