import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

import { config } from '../configuration/config';
import { LoginResponse } from '../models/LoginResponse';
import { SharedService } from './shared.service';
import { MessageService } from './message.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private sharedService: SharedService,
    private messageService: MessageService
  ) {
    this.loadGoogleSignInLibrary();
  }

  private isLoggedIn = new BehaviorSubject<boolean>(this.hasToken());
  private tokenTimer: any;
  private clientId = environment.googleClientId;

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

  private loadGoogleSignInLibrary() {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }

  public initializeGoogleSignIn() {
    if (window['google'] && window['google'].accounts) {
      window['google'].accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: any) => this.onGoogleSignIn(response) // Bind `this` correctly here
      });
      this.renderSignInButton();
    } else {
      console.error('Google accounts API not loaded');
    }
  }

  private renderSignInButton() {
    const buttonContainer = document.getElementById('googleSignInButton');
    if (buttonContainer) {
      window['google'].accounts.id.renderButton(
        buttonContainer,
        { theme: 'outline', size: 'large' }
      );
    }
  }

  // Trigger the Google sign-in flow on button press
  public promptGoogleSignIn() {
    window['google'].accounts.id.prompt(); // This will show the Google sign-in dialog
  }

  public onGoogleSignIn(response: any) {
    const token = response.credential;

    this.http
      .post<any>(config.apiBaseUrl + config.urls.onGoogleSignIn, { token })
      .subscribe((res) => {
        this.saveTokenInLocalStorage(res),
        this.setLoginStatus(true);
        this.router.navigate(['overview']);
      })
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
    this.messageService.setIsLoading(false);
    localStorage.clear();
  }
}
