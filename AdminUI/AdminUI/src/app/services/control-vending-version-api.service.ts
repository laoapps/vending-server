import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ControlVendingVersionAPIService {

  private url: string = environment.url;

  constructor(
    private http: HttpClient
  ) { }

  createVendingVersion(params: any): Observable<any> {
    return this.http.post(this.url + '/vending-version/create', params);
  }
  loadAllVersion(params: any): Observable<any> {
    return this.http.post(this.url + '/vending-version/load-all-version', params);
  }
  setUpdateVersion(params: any): Observable<any> {
    return this.http.post(this.url + '/vending-version/set-update-version', params);
  }

}
