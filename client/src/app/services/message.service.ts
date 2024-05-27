import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  constructor() {}

  private subject = new Subject<any>();
  
  private emitIsLoading = new BehaviorSubject(false);
  isLoading$ = this.emitIsLoading.asObservable();

  sendMessage(message: string) {
    this.subject.next({ text: message });
  }

  clearMessages() {
    this.subject.next();
  }

  getMessage(): Observable<any> {
    return this.subject.asObservable();
  }

  setIsLoading(value: boolean) {
    this.emitIsLoading.next(value);
  }
}
