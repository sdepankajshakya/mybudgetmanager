import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { config } from '../configuration/config';

@Injectable({
  providedIn: 'root'
})
export class OverviewService {

  constructor(private http: HttpClient) { }
}
