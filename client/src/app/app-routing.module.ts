import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { SignupComponent } from './components/signup/signup.component';
import { OverviewComponent } from './components/overview/overview.component';
import { LoginComponent } from './components/login/login.component';
import { AuthenticationGuard } from './guards/authentication.guard';
import { SettingsComponent } from './components/settings/settings.component';
import { SettingsService } from './services/settings.service';
import { ProfileComponent } from './components/profile/profile.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { GettingStartedComponent } from './components/getting-started/getting-started.component';
import { HomepageComponent } from './components/homepage/homepage.component';

const routes: Routes = [
  { path: '', component: HomepageComponent, title: 'Home' },
  { path: 'signup', component: SignupComponent, title: 'Sign up' },
  { path: 'login', component: LoginComponent, title: 'Login' },
  { path: 'profile', component: ProfileComponent, title: 'Profile' },
  {
    path: 'overview',
    component: OverviewComponent,
    resolve: { currentSettings: SettingsService },
    canActivate: [AuthenticationGuard],
    title: 'Dashboard'
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthenticationGuard],
    title: 'Settings'
  },
  {
    path: 'gettingstarted',
    component: GettingStartedComponent,
    canActivate: [AuthenticationGuard],
    title: 'Getting Started'
  },
  {
    path: 'contactus',
    component: ContactUsComponent,
    title: 'Contact Us'
  },
  { path: '**', redirectTo: '/' }, // redirect to homepage if route not found
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
  providers: [AuthenticationGuard],
})
export class AppRoutingModule {}
