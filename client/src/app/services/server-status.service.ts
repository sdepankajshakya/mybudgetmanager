import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServerStatusService {
  private isServerWakingSubject = new BehaviorSubject<boolean>(false);
  public isServerWaking$ = this.isServerWakingSubject.asObservable();

  showServerWaking() {
    this.isServerWakingSubject.next(true);
  }

  hideServerWaking() {
    this.isServerWakingSubject.next(false);
  }
}
