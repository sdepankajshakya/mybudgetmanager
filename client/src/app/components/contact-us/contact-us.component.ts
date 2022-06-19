import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/User';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements OnInit {

  constructor(private sharedService: SharedService, private fb: FormBuilder) { }

  currentUser!: User;
  contactUsForm!: FormGroup;

  ngOnInit(): void {
    const current_user = this.sharedService.getItemFromLocalStorage('current_user');
    if (current_user) {
      this.currentUser = current_user;
    }

    this.contactUsForm = this.fb.group({
      firstName: new FormControl(this.currentUser.firstName),
      lastName: new FormControl(this.currentUser.lastName),
      email: new FormControl(this.currentUser.email, Validators.required),
      message: new FormControl('', Validators.required)
    });
  }

}
