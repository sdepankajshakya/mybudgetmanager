import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
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
    private toastr: ToastrService) { }

  currentUser!: User;
  contactUsForm!: UntypedFormGroup;
  messageSent: boolean = false;
  contactedUs: boolean = false;

  ngOnInit(): void {
    const current_user = this.sharedService.getItemFromLocalStorage('current_user');
    this.contactedUs = this.sharedService.getItemFromLocalStorage('contacted_us');
    if (current_user) {
      this.currentUser = current_user;
    }

    this.contactUsForm = this.fb.group({
      firstName: new UntypedFormControl(this.currentUser ? this.currentUser.firstName: ''),
      lastName: new UntypedFormControl(this.currentUser ? this.currentUser.lastName: ''),
      email: new UntypedFormControl(this.currentUser ? this.currentUser.email : '', Validators.required),
      message: new UntypedFormControl('', Validators.required),
    });
  }

  onSubmit() {
    let contactUsMessage = this.contactUsForm.getRawValue();
    if (contactUsMessage.message) {
      this.settingsService.contactUs(contactUsMessage).subscribe(res => {
        this.contactUsForm.reset();
        this.messageSent = true;
        this.sharedService.setItemToLocalStorage('contacted_us', true);
        this.toastr.success('Your message has been sent!');
      })
    } else {
      this.toastr.error('Your message can\'t be empty');
    }
  }

}
