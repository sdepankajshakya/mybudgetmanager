import { Component, HostBinding, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';

import { MatSidenav } from '@angular/material/sidenav';

import { MessageService } from './services/message.service';
import { AuthenticationService } from './services/authentication.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy {
  title = 'budget-manager';
  isLoggedIn: boolean = false;
  messageSubscription: Subscription;
  loginStatusSubsciption: Subscription;
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isDarkMode: boolean = false;

  constructor(
    private authService: AuthenticationService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.loginStatusSubsciption = this.authService
      .getLoginStatus()
      .subscribe((status) => {
        this.isLoggedIn = status;
      });

    this.messageSubscription = this.messageService
      .getMessage()
      .subscribe((message) => {
        // toggle sidebar
        if (message.text === 'open sidebar') {
          this.sidenav.open();
        }
        if (message.text === 'close sidebar') {
          this.close('toggle button');
        }

        // set/unset darkMode based on the toggle on header
        if (message.text === 'darkMode') {
          this.isDarkMode = true;
        }
        if (message.text === 'lightMode') {
          this.isDarkMode = false;
        }

        // set/unset darkMode based on settings API
        if (message.text === 'enable darkMode') {
          this.isDarkMode = true;
        }
        if (message.text === 'enable lightMode') {
          this.isDarkMode = false;
        }
      });

    if (this.isLoggedIn) this.router.navigate(['overview']);
  }

  ngOnInit() {}

  close(reason: string) {
    this.sidenav.close();
    this.messageService.sendMessage(reason);
  }

  @HostBinding('class')
  get themeMode() {
    return this.isDarkMode ? 'darkMode' : 'lightMode';
  }

  ngOnDestroy(): void {
    this.loginStatusSubsciption.unsubscribe();
  }
}
