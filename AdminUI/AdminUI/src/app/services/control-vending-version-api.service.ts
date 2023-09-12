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

  showVendingVersion(params: any): Observable<any> {
    return this.http.post(this.url + '/showvendingversion', params);
  } 
  findVendingVersion(params: any): Observable<any> {
    return this.http.post(this.url + '/findvendingversion', params);
  }
  createVendingVersion(params: any): Observable<any> {
    return this.http.post(this.url + '/createvendingversion', params);
  }
  updateVendingVersionDescription(params: any): Observable<any> {
    return this.http.post(this.url + '/updatevendingversiondescription', params);
  }

}
