import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'no-internet',
  templateUrl: './no-internet.component.html',
  styleUrls: ['./no-internet.component.scss']
})
export class NoInternetComponent implements OnInit {
  isOffline: boolean = false;

  constructor() { }

  ngOnInit(): void {
    this.checkNetworkStatus();

    window.addEventListener('online', this.checkNetworkStatus.bind(this));
    window.addEventListener('offline', this.checkNetworkStatus.bind(this));
  }

  checkNetworkStatus(): void {
    this.isOffline = !navigator.onLine;
  }

  retryConnection(): void {
    window.location.reload(); // Simple way to check if internet is back
  }
}