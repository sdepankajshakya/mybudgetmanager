import { Component, OnInit } from '@angular/core';
import { User } from '../../models/User';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  constructor(private sharedService: SharedService) {}

  url: any;
  currentUser!: User;

  ngOnInit(): void {
    const current_user =
      this.sharedService.getItemFromLocalStorage('current_user');
    if (current_user) {
      this.currentUser = current_user;
    }
  }

  onSelectFile(event: any) {
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();

      reader.readAsDataURL(event.target.files[0]); // read file as data url

      reader.onload = (event) => {
        // called once readAsDataURL is completed
        this.url = event.target!.result;
      };
    }
  }

  delete() {
    this.url = null;
  }
}
