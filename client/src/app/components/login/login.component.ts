import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { AuthenticationService } from 'src/app/services/authentication.service';
import { ErrorHandlerComponent } from '../error-handler/error-handler.component';

import { SocialAuthService } from 'angularx-social-login';
import {
  FacebookLoginProvider,
  GoogleLoginProvider,
} from 'angularx-social-login';
import { ThemePalette } from '@angular/material/core';
import { LoginResponse } from 'src/app/models/LoginResponse';
import { MessageService } from 'src/app/services/message.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginStatusSubsciption: Subscription;
  isLoggedIn: boolean = false;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthenticationService,
    private socialAuthService: SocialAuthService,
    private messageService: MessageService
  ) {
    this.loginStatusSubsciption = this.authService
      .getLoginStatus()
      .subscribe((status) => {
        this.isLoggedIn = status;
      });
  }

  hide = true;
  color: ThemePalette = 'accent';

  ngOnInit(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['overview']);
    }
  }

  onLogin(form: NgForm) {
    this.messageService.setIsLoading(true);
    if (form.invalid) {
      this.dialog.open(ErrorHandlerComponent, {
        data: { message: 'Invalid email or password' },
      });
      this.messageService.setIsLoading(false);
      return;
    }

    this.authService.login(form.value).subscribe(
      (res) => {
        const response = res as LoginResponse;
        if (response.data) {
          this.authService.setLoginStatus(true);
          this.router.navigate(['overview']);
        }
      },
      (err) => {
        this.messageService.setIsLoading(false);
      }
    );
  }

  signInWithGoogle(): void {
    this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID).then((socialUser) => {
      this.authService.signInWithGoogle(socialUser).subscribe(
        (res) => {
          this.messageService.setIsLoading(true);
          const response = res as LoginResponse;
          if (response.data) {
            this.authService.setLoginStatus(true);
            this.router.navigate(['overview']);
          }
        },
        (err) => {
          this.messageService.setIsLoading(false);
        }
      );
    }).catch(data => {
      this.router.navigate(['login']);
    });
  }

  signInWithFB(): void {
    this.socialAuthService.signIn(FacebookLoginProvider.PROVIDER_ID);
  }

  ngOnDestroy() {
    this.loginStatusSubsciption.unsubscribe();
  }
}
