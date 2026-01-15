import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-server-waking',
  templateUrl: './server-waking.component.html',
  styleUrls: ['./server-waking.component.scss']
})
export class ServerWakingComponent implements OnInit, OnDestroy {
  showSlowMessage: boolean = false;
  private slowMessageTimeout: any;

  ngOnInit() {
    // Show the "server waking up" message after 5 seconds
    this.slowMessageTimeout = setTimeout(() => {
      this.showSlowMessage = true;
    }, 5000);
  }

  ngOnDestroy() {
    if (this.slowMessageTimeout) {
      clearTimeout(this.slowMessageTimeout);
    }
  }
}