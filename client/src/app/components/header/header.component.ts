import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { AuthenticationService } from 'src/app/services/authentication.service';

import { ThemePalette } from '@angular/material/core';
import { MessageService } from 'src/app/services/message.service';
import { SharedService } from 'src/app/services/shared.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  loginStatusSubsciption: Subscription;
  messageSubscription: Subscription;
  sidenav = false; // hamburger menu icon
  color: ThemePalette = 'accent';
  isDarkMode: boolean = false;

  constructor(
    private authService: AuthenticationService,
    private messageService: MessageService,
    private sharedService: SharedService,
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
        if (
          message.text === 'backdrop' ||
          message.text === 'escape' ||
          message.text === 'close sidebar'
        ) {
          this.sidenav = false;
        }
      });
  }

  ngOnInit(): void {
    this.isDarkMode = this.sharedService.getItemFromLocalStorage('darkMode');
  }

  toggleDarkmode() {
    if (!this.isDarkMode) {
      this.sharedService.setItemToLocalStorage('darkMode', true);
      this.messageService.sendMessage('darkMode');
    } else {
      this.sharedService.setItemToLocalStorage('darkMode', false);
      this.messageService.sendMessage('lightMode');
    }
  }

  toggleSidebar() {
    this.sidenav = !this.sidenav;
    if (this.sidenav) {
      this.messageService.sendMessage('open sidebar');
    } else {
      this.messageService.sendMessage('close sidebar');
    }
  }

  onEditProfile() {
    this.router.navigate(['profile']);
  }

  goToHome() {
    this.router.navigate(['overview']);
  }

  onLogout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.messageSubscription.unsubscribe();
  }
}
