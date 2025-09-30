import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  public url: string = 'https://hangmistore-api.laoapps.com/api/v1/';
  constructor(
    private http:HttpClient
  ) { }

  register(param: any): Observable<any> {
    return this.http.post(this.url + 'authUM/register', param);
  }
  login(param: any): Observable<any> {
    return this.http.post(this.url + 'authUM/login', param);
  }
}
