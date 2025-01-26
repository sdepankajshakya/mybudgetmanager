import { AfterViewChecked, ChangeDetectorRef, Component, HostBinding, Inject, LOCALE_ID, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { SwUpdate } from '@angular/service-worker';

import { MatSidenav } from '@angular/material/sidenav';

import { MessageService } from './services/message.service';
import { AuthenticationService } from './services/authentication.service';
import { Router } from '@angular/router';
import { SharedService } from './services/shared.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewChecked, OnDestroy {
  title = 'budget-manager';
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

    this.isLoadingSubcription = this.messageService.isLoading$.subscribe(value => {
      this.isLoading = value;
    })
  }
  ngOnInit() {
    const userLocale = navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language;
    this.sharedService.setItemToLocalStorage('userLocale', userLocale);

    const robotoLink = document.createElement('link');
    robotoLink.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap';
    robotoLink.rel = 'stylesheet';
    document.head.appendChild(robotoLink);

    const materialIconsLink = document.createElement('link');
    materialIconsLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    materialIconsLink.rel = 'stylesheet';
    document.head.appendChild(materialIconsLink);
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
    return this.isDarkMode ? 'darkMode' : 'lightMode';
  }

  ngOnDestroy(): void {
    this.loginStatusSubsciption.unsubscribe();
    this.isLoadingSubcription.unsubscribe();
  }
}
