import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { User } from 'src/app/models/User';
import { SettingsService } from 'src/app/services/settings.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements OnInit {

  constructor(
    private sharedService: SharedService,
    private settingsService: SettingsService,
    private fb: UntypedFormBuilder,
    private snackbar: SnackbarService) { }

  currentUser!: User;
  contactUsForm!: FormGroup<{
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    email: FormControl<string>;
    message: FormControl<string>;
  }>;
  messageSent: boolean = false;
  contactedUs: boolean = false;

  ngOnInit(): void {
    const current_user = this.sharedService.getItemFromLocalStorage('current_user');
    this.contactedUs = this.sharedService.getItemFromLocalStorage('contacted_us');
    if (current_user) {
      this.currentUser = current_user;
    }

    this.contactUsForm = this.fb.group({
      firstName: new FormControl<string>(this.currentUser ? this.currentUser.firstName : ''),
      lastName: new FormControl<string>(this.currentUser ? this.currentUser.lastName : ''),
      email: new FormControl<string>(this.currentUser ? this.currentUser.email : '', Validators.required),
      message: new FormControl<string>('', Validators.required),
    });
  }

  onSubmit() {
    let contactUsMessage = this.contactUsForm.getRawValue();
    if (contactUsMessage.message) {
      this.settingsService.contactUs(contactUsMessage).subscribe(res => {
        this.contactUsForm.reset();
        this.messageSent = true;
        this.sharedService.setItemToLocalStorage('contacted_us', true);
        this.snackbar.success('Your message has been sent!');
      })
    } else {
      this.snackbar.error('Your message can\'t be empty');
    }
  }

}
