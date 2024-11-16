import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { AuthenticationService } from 'src/app/services/authentication.service';
import { ErrorHandlerComponent } from '../error-handler/error-handler.component';

import { ThemePalette } from '@angular/material/core';
import { LoginResponse } from 'src/app/models/LoginResponse';
import { MessageService } from 'src/app/services/message.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

declare var google: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginStatusSubsciption: Subscription;
  isLoggedIn: boolean = false;
  private accessToken = '';
  clientId = environment.googleClientId;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthenticationService,
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

    this.authService.initializeGoogleSignIn();
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

  ngOnDestroy() {
    this.loginStatusSubsciption.unsubscribe();
  }
}
