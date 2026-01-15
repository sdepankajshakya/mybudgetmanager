import { AfterViewChecked, ChangeDetectorRef, Component, HostBinding, Inject, LOCALE_ID, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { SwUpdate } from '@angular/service-worker';

import { MatSidenav } from '@angular/material/sidenav';

import { MessageService } from './services/message.service';
import { AuthenticationService } from './services/authentication.service';
import { SettingsService } from './services/settings.service';
import { Router } from '@angular/router';
import { SharedService } from './services/shared.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewChecked, OnDestroy {
  title = 'Budget Manager';
  isLoggedIn: boolean = false;
  messageSubscription: Subscription;
  loginStatusSubsciption: Subscription;
  isLoadingSubcription: Subscription;
  userLocale: string = '';

  @ViewChild('sidenav') sidenav!: MatSidenav;
  isDarkMode: boolean = false;
  isLoading: boolean = false;

  constructor(
    private authService: AuthenticationService,
    private messageService: MessageService,
    private sharedService: SharedService,
    private settingsService: SettingsService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private swUpdate: SwUpdate,
    @Inject(LOCALE_ID) private locale: string
  ) {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          if (confirm("New version available. Load new version?")) {
            window.location.reload();
          }
        }
      });
    }

    this.userLocale = locale;
    this.loginStatusSubsciption = this.authService.getLoginStatus().subscribe((status) => {
      this.isLoggedIn = status;
      
      // Load theme when user logs in
      if (status) {
        this.loadThemeFromSettings();
      }
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

        // Apply theme when received from settings
        if (message.text && message.text.startsWith('apply-theme:')) {
          const themeName = message.text.replace('apply-theme:', '');
          this.applyThemeToBody(themeName);
        }

        // Initialize theme with fallback if no settings are available
        if (message.text === 'initialize-theme-fallback') {
        const savedTheme = localStorage.getItem('selectedTheme') || 'orange';
          this.applyThemeToBody(savedTheme);
        }
      });

    if (this.isLoggedIn) this.router.navigate(['dashboard']);

    this.isLoadingSubcription = this.messageService.isLoading$.subscribe(value => {
      this.isLoading = value;
      
      // Hide HTML loader when first API call completes
      if (!value) {
        const loader = document.getElementById('app-loader');
        if (loader) {
          loader.classList.add('hidden');
        }
      }
    })
  }
  
  ngOnInit() {
    const userLocale = navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language;
    this.sharedService.setItemToLocalStorage('userLocale', userLocale);
    
    // Load theme if user is already logged in
    if (this.isLoggedIn) {
      this.loadThemeFromSettings();
    } else {
      // Load fallback theme for logged out state
      this.initializeFallbackTheme();
    }
  }

  ngAfterViewChecked(): void {
    this.cd.detectChanges();
  }

  close(reason: string) {
    this.sidenav.close();
    this.messageService.sendMessage(reason);
  }

  @HostBinding('class')
  get themeMode() {
    if (this.isDarkMode) {
      document.body.classList.add('darkMode');
      return 'darkMode';
    } else {
      document.body.classList.remove('darkMode');
      return 'lightMode';
    }
  }

  private initializeTheme(): void {
  const savedTheme = localStorage.getItem('selectedTheme') || 'orange';
    this.applyThemeToBody(savedTheme);
  }

  private applyThemeToBody(themeName: string): void {
    const availableThemes = ['blue', 'green', 'purple', 'orange', 'red', 'teal', 'indigo', 'pink'];
    
    // Remove existing theme classes
    availableThemes.forEach(theme => {
      document.body.classList.remove(`theme-${theme}`);
    });
    
    // Add new theme class
    document.body.classList.add(`theme-${themeName}`);
  }

  private loadThemeFromSettings(): void {
    this.settingsService.getSettings().subscribe(
      (res) => {
        let response = res as any;
        if (response && response.data && response.data.length) {
          const currentSettings = response.data[0];
          const theme = currentSettings.theme;
          
          // Apply theme and sync with localStorage
          this.applyThemeToBody(theme);
          localStorage.setItem('selectedTheme', theme);
        } else {
          // No settings found, use fallback
          this.initializeFallbackTheme();
        }
      },
      (error) => {
        // API error, use fallback
        this.initializeFallbackTheme();
      }
    );
  }

  private initializeFallbackTheme(): void {
  const savedTheme = localStorage.getItem('selectedTheme') || 'orange';
    this.applyThemeToBody(savedTheme);
  }

  ngOnDestroy(): void {
    this.loginStatusSubsciption.unsubscribe();
    this.isLoadingSubcription.unsubscribe();
  }
}
