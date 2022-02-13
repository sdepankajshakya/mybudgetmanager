import { Component, HostBinding, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';

import { MatSidenav } from '@angular/material/sidenav';

import { MessageService } from './services/message.service';
import { AuthenticationService } from './services/authentication.service';
import { SharedService } from './services/shared.service';

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
    private sharedService: SharedService
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
        if (message.text === 'darkMode') {
          this.isDarkMode = true;
        }
        if (message.text === 'lightMode') {
          this.isDarkMode = false;
        }
      });
  }

  ngOnInit() {
    this.isDarkMode = this.sharedService.getItemFromLocalStorage('darkMode');
  }

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
