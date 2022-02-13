import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AuthenticationService } from 'src/app/services/authentication.service';
import { ErrorHandlerComponent } from '../error-handler/error-handler.component';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent implements OnInit {
  constructor(
    private dialog: MatDialog,
    private authService: AuthenticationService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  hide = true;
  isLoading = false;

  ngOnInit(): void {}

  onSignup(form: NgForm) {
    this.isLoading = true;

    if (form.invalid) {
      this.dialog.open(ErrorHandlerComponent, {
        data: { message: 'Invalid fields' },
      });
      this.isLoading = false;
      return;
    }

    this.authService.createUser(form.value).subscribe((res) => {
      this.isLoading = false;
      this.toastr.success(
        'Your account has been successfully created',
        'Success!'
      );
      this.router.navigate(['login']);
    });
  }
}
