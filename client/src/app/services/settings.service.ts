import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { config } from '../configuration/config';
import { tap } from 'rxjs/operators';
import { Resolve } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class SettingsService implements Resolve<any> {
  constructor(private http: HttpClient) {}

  resolve() {
    return this.http
      .get<{ data: any }>(config.apiBaseUrl + config.urls.getSettings)
      .pipe(
        tap((response) => {
          if (response && response.data && response.data.length) {
            localStorage.setItem('settings', JSON.stringify(response.data[0]));
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
          }
        })
      );
  }

  getCurrencies() {
    return this.http.get(config.apiBaseUrl + config.urls.getCurrencies);
  }

  getCategories() {
    return this.http.get(config.apiBaseUrl + config.urls.getCategories);
  }

  updateSettings(settings: any) {
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
}
