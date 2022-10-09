import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

import { config } from '../configuration/config';
import { LoginResponse } from '../models/LoginResponse';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private sharedService: SharedService
  ) {}

  private isLoggedIn = new BehaviorSubject<boolean>(this.hasToken());
  private tokenTimer: any;

  private hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  }

  setLoginStatus(status: boolean) {
    this.isLoggedIn.next(status);
  }

  getLoginStatus(): Observable<any> {
    return this.isLoggedIn.asObservable();
  }

  createUser(user: any) {
    return this.http.post(config.apiBaseUrl + config.urls.signup, user);
  }

  login(user: any) {
    return this.http
      .post<LoginResponse>(config.apiBaseUrl + config.urls.login, user)
      .pipe(
        tap((response) => {
          this.saveTokenInLocalStorage(response);
        })
      );
  }

  signInWithGoogle(socialUser: any) {
    return this.http
      .post<LoginResponse>(
        config.apiBaseUrl + config.urls.signInWithGoogle,
        socialUser
      )
      .pipe(
        tap((response) => {
          this.saveTokenInLocalStorage(response);
        })
      );
  }

  saveTokenInLocalStorage(response: LoginResponse) {
    localStorage.setItem('access_token', response.data.access_token);
    this.sharedService.setItemToLocalStorage(
      'current_user',
      response.data.current_user
    );

    // automatically logout after expiresIn
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, 1000 * 60 * 60 * 24);
  }

  logout() {
    clearTimeout(this.tokenTimer);
    this.router.navigate(['login']);
    this.setLoginStatus(false);
    localStorage.clear();
  }
}
