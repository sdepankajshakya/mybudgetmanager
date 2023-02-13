import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';

import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AuthenticationService } from 'src/app/services/authentication.service';
import { MessageService } from 'src/app/services/message.service';
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
    private messageService: MessageService,
    private router: Router
  ) {}

  hide = true;
  color: ThemePalette = 'accent';

  ngOnInit(): void {}

  onSignup(form: NgForm) {
    this.messageService.setIsLoading(true);

    if (form.invalid) {
      this.dialog.open(ErrorHandlerComponent, {
        data: { message: 'Invalid email or password' },
      });
       this.messageService.setIsLoading(false);
      return;
    }

    this.authService.createUser(form.value).subscribe((res) => {
      this.messageService.setIsLoading(false);
      this.toastr.success(
        'Your account has been successfully created. Please login to continue.',
        'Success!'
      );
      this.router.navigate(['login']);
    }, (err) => {
      this.messageService.setIsLoading(false);
    });
  }
}
