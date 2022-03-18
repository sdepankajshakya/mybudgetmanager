import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { config } from '../configuration/config';
import { tap } from 'rxjs/operators';
import { Resolve } from '@angular/router';
import { MessageService } from './message.service';
import { Settings } from '../models/Settings';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root',
})
export class SettingsService implements Resolve<any> {
  constructor(
    private http: HttpClient,
    private messageService: MessageService
  ) {}

  resolve() {
    return this.http
      .get<{ data: any }>(config.apiBaseUrl + config.urls.getSettings)
      .pipe(
        tap((response) => {
          if (response && response.data && response.data.length) {
            localStorage.setItem('settings', JSON.stringify(response.data[0]));
            this.isDarkMode(response.data[0]);
          }
        })
      );
  }

  getSettings() {
    return this.http
      .get<{ data: any }>(config.apiBaseUrl + config.urls.getSettings)
      .pipe(
        tap((response) => {
          if (response && response.data && response.data.length) {
            localStorage.setItem('settings', JSON.stringify(response.data[0]));
            this.isDarkMode(response.data[0]);
          }
        })
      );
  }

  isDarkMode(settings: Settings) {
    if (settings && settings.darkMode) {
      this.messageService.sendMessage('enable darkMode');
    } else {
      this.messageService.sendMessage('enable lightMode');
    }
  }

  getCurrencies() {
    return this.http.get(config.apiBaseUrl + config.urls.getCurrencies);
  }

  getCategories() {
    return this.http.get(config.apiBaseUrl + config.urls.getCategories);
  }

  updateSettings(settings: Settings) {
    return this.http.post(
      config.apiBaseUrl + config.urls.updateSettings,
      settings
    );
  }

  uploadSpreadsheet(file: any) {
    return this.http.post(
      config.apiBaseUrl + config.urls.uploadSpreadsheet,
      file
    );
  }

  downloadSpreadsheet() {
    return this.http.get(config.apiBaseUrl + config.urls.downloadSpreadsheet);
  }

  deleteTransactions(user: User) {
    return this.http.post(
      config.apiBaseUrl + config.urls.deleteAllTransactions,
      user
    );
  }
}
