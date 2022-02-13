import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  constructor() {}

  getItemFromLocalStorage(item: string) {
    if (localStorage.getItem(item)) {
      return JSON.parse(localStorage.getItem(item) || '');
    }
  }

  setItemToLocalStorage(item: string, data: any) {
    localStorage.setItem(item, JSON.stringify(data));
  }
}
