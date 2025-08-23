import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/app/smartcb/environments/environment';
import * as cryptojs from 'crypto-js';
@Injectable({
  providedIn: 'root',
})
export class ApiVendingService {
  private apiUrl = environment.apiUrl;
  machineId: any;
  otp: any;
  token:any
  constructor(private http: HttpClient) {
    this.machineId = localStorage.getItem('machineId');
    this.otp = localStorage.getItem('otp');
    this.token = cryptojs.SHA256(this.machineId + this.otp).toString(cryptojs.enc.Hex);
    console.log('====================================');
    console.log('machineId', this.machineId);
    console.log('otp', this.otp);
    console.log('====================================');
    console.log('token',this.token);
    console.log('====================================');
    console.log('====================================');
  }

  private getAuthHeaders() {
    return {
      headers: new HttpHeaders({
        // Authorization: `Bearer ${machineId}`,
      })
        .set('token', this.token+'')
    };
  }

  load_all_group(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/groups/loadAllGroupsHMVending`,
      {},
      this.getAuthHeaders()
    );
  }

  getDevicesBy(data): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/devices/getDevicesByHMVending`,
      data,
      this.getAuthHeaders()
    );
  }

  schedulepackages(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/schedule-packages/findByOwnerIDHMVending`,
      this.getAuthHeaders()
    );
  }

  orders(data): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/orders/hmvending`,
      data,
      this.getAuthHeaders()
    );
  }

  findByPackageIDs(data: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/schedule-packages/findByPackageIDsHMVending`,
      data,
      this.getAuthHeaders()
    );
  }

  load_order(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/orders/listHMVending`,
      {},
      this.getAuthHeaders()
    );
  }

  load_history(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/orders/listHMVending?q=complete`,
      {},
      this.getAuthHeaders()
    );
  }

  controlbyorder(id: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/devices/controlbyorder_hmvending/${id}`,
      {},
      this.getAuthHeaders()
    );
  }
}
