import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { AuthenticationService } from 'src/app/services/authentication.service';

import { ThemePalette } from '@angular/material/core';
import { MessageService } from 'src/app/services/message.service';
import { SharedService } from 'src/app/services/shared.service';
import { NavigationEnd, Router } from '@angular/router';
import { SettingsService } from 'src/app/services/settings.service';
import { Settings } from 'src/app/models/Settings';

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
  currentSettings!: Settings;
  currentRoute: string = '';

  constructor(
    private authService: AuthenticationService,
    private messageService: MessageService,
    private sharedService: SharedService,
    private settingsService: SettingsService,
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
        // enable/disable darkMode toggle based on settings API
        if (message.text === 'enable lightMode') {
          this.isDarkMode = false;
        }
        if (message.text === 'enable darkMode') {
          this.isDarkMode = true;
        }
      });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.currentRoute = event.url;
    });
  }

  ngOnInit(): void {}

  updateDarkModeClass() {
    if (!this.isDarkMode) {
      document.body.classList.add('darkMode');
    } else {
      document.body.classList.remove('darkMode');
    }
  }

  toggleDarkmode() {
    this.currentSettings =
      this.sharedService.getItemFromLocalStorage('settings');

    if (!this.currentSettings) {
      // default current settings
      this.currentSettings = {
        currency: null as any,
        darkMode: false,
      };
    }

    if (this.isDarkMode) {
      this.currentSettings.darkMode = false;
      this.messageService.sendMessage('lightMode');
    } else {
      this.currentSettings.darkMode = true;
      this.messageService.sendMessage('darkMode');
    }

    this.updateSettings();
    this.updateDarkModeClass();
  }

  updateSettings() {
    this.settingsService
      .updateSettings(this.currentSettings)
      .subscribe(() => {});
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
    this.isLoggedIn
      ? this.router.navigate(['overview'])
      : this.router.navigate(['']);
  }

  goToLogin() {
    this.router.navigate(['login']);
  }

  onLogout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.messageSubscription.unsubscribe();
  }
}
