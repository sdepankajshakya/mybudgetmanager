import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HighchartsChartModule } from 'highcharts-angular';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrModule } from 'ngx-toastr';

import { AppComponent } from './app.component';
import { OverviewComponent } from './components/overview/overview.component';
import { TransactionListComponent } from './components/overview/transaction-list/transaction-list.component';
import { AddTransactionComponent } from './components/overview/add-transaction/add-transaction.component';
import { TransactionItemComponent } from './components/overview/transaction-list/transaction-item/transaction-item.component';
import { HeaderComponent } from './components/header/header.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SignupComponent } from './components/signup/signup.component';
import { LoginComponent } from './components/login/login.component';
import { ErrorHandlerComponent } from './components/error-handler/error-handler.component';
import { HttpInterceptorService } from './services/http-interceptor.service';
import { AuthenticationService } from './services/authentication.service';
import { ErrorInterceptorService } from './services/error-interceptor.service';
import { SettingsComponent } from './components/settings/settings.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ModalModule } from 'ngx-bootstrap/modal';

import { FullCalendarModule } from '@fullcalendar/angular';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import { ProfileComponent } from './components/profile/profile.component';

import {
  SocialLoginModule,
  SocialAuthServiceConfig,
} from 'angularx-social-login';
import {
  GoogleLoginProvider,
  FacebookLoginProvider,
} from 'angularx-social-login';

const web = {
  client_id:
    '530562955070-2r62masjenjk4oksn7s87a9g1f4aq655.apps.googleusercontent.com',
  project_id: 'budget-manager-336320',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_secret: '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',
  redirect_uris: ['http://localhost:4200/'],
  javascript_origins: ['http://localhost:4200'],
};

FullCalendarModule.registerPlugins([interactionPlugin, dayGridPlugin]);
@NgModule({
  declarations: [
    AppComponent,
    OverviewComponent,
    TransactionListComponent,
    AddTransactionComponent,
    TransactionItemComponent,
    HeaderComponent,
    ConfirmDialogComponent,
    SidebarComponent,
    SignupComponent,
    LoginComponent,
    ErrorHandlerComponent,
    SettingsComponent,
    ProfileComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    HighchartsChartModule,
    MatCardModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatSidenavModule,
    MatIconModule,
    MatProgressBarModule,
    MatMenuModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    ToastrModule.forRoot(),
    ScrollingModule,
    FullCalendarModule,
    SocialLoginModule,
    ModalModule.forRoot(),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptorService,
      multi: true,
    },
    AuthenticationService,
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(web.client_id),
          },
          {
            id: FacebookLoginProvider.PROVIDER_ID,
            provider: new FacebookLoginProvider(web.client_id),
          },
        ],
      } as SocialAuthServiceConfig,
    },
  ],
  bootstrap: [AppComponent],
  // entryComponents: [ErrorHandlerComponent]
})
export class AppModule {}
