import { NgModule, isDevMode } from '@angular/core';
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
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';

import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AddTransactionComponent } from './components/dashboard/add-transaction/add-transaction.component';
import { HeaderComponent } from './components/header/header.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SignupComponent } from './components/signup/signup.component';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ErrorHandlerComponent } from './components/error-handler/error-handler.component';
import { HttpInterceptorService } from './services/http-interceptor.service';
import { AuthenticationService } from './services/authentication.service';
import { ErrorInterceptorService } from './services/error-interceptor.service';
import { SettingsComponent } from './components/settings/settings.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ModalModule } from 'ngx-bootstrap/modal';

import { FullCalendarModule } from '@fullcalendar/angular';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { CurrencyPipe } from '@angular/common';
import { FileSaverModule } from 'ngx-filesaver';
import { FilterPipe } from './shared/filter.pipe';
import { HomepageComponent } from './components/homepage/homepage.component';
import { SpinnerComponent } from './shared/spinner/spinner.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from 'src/environments/environment';
import { NoInternetComponent } from './components/no-internet/no-internet.component';
import { FilterModalComponent } from './components/dashboard/filter-modal/filter-modal.component';
import { TransactionListComponent } from './components/dashboard/transaction-list/transaction-list.component';
import { FinancialOverviewComponent } from './components/dashboard/financial-overview/financial-overview.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    AddTransactionComponent,
    HeaderComponent,
    ConfirmDialogComponent,
    SidebarComponent,
    SignupComponent,
    LoginComponent,
    ErrorHandlerComponent,
    SettingsComponent,
    ProfileComponent,
    ContactUsComponent,
    FilterPipe,
    HomepageComponent,
    SpinnerComponent,
    NoInternetComponent,
    FilterModalComponent,
    TransactionListComponent,
    FinancialOverviewComponent,
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
    MatDividerModule,
    MatToolbarModule,
    ScrollingModule,
    FullCalendarModule,
    MatRadioModule,
    MatButtonToggleModule,
    FileSaverModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    ModalModule.forRoot(),
    NgxMatSelectSearchModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
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
    CurrencyPipe,
  ],
  bootstrap: [AppComponent],
  // entryComponents: [ErrorHandlerComponent]
})
export class AppModule { }
