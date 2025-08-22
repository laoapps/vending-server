import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/app/smartcb/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiVendingService {
  private apiUrl = environment.apiUrl;
  machineId:any
  otp:any
  constructor(private http: HttpClient) {
    this.machineId = localStorage.getItem('machineId');
    this.otp = localStorage.getItem('otp');
  }

  private getAuthHeaders() {
    const machineId = localStorage.getItem('machineId');
    const otp = localStorage.getItem('otp');
    return {
      headers: new HttpHeaders({
        // Authorization: `Bearer ${machineId}`,
      }).set("machineId",machineId).set("otp", otp)
    };
  }

    load_all_group(): Observable<any> {
      return this.http.post(`${this.apiUrl}/groups/loadAll_`, {}, this.getAuthHeaders());
    }
  
    getDevicesBy(data): Observable<any> {
      return this.http.post(`${this.apiUrl}/devices/getDevicesBy_`, data, this.getAuthHeaders());
    }
  
    schedulepackages(ownerID: number): Observable<any> {
      return this.http.get(`${this.apiUrl}/schedule-packages/findByOwnerID_/${ownerID}`, this.getAuthHeaders());
    }
  
    orders(data): Observable<any> {
      return this.http.post(`${this.apiUrl}/orders/newOrderFromVending`, data, this.getAuthHeaders());
    }

    findByPackageIDs(data:any): Observable<any> {
      return this.http.post(`${this.apiUrl}/schedule-packages/findByPackageIDsHMVending`,data, this.getAuthHeaders());
    }

    load_order(): Observable<any> {
      return this.http.post(`${this.apiUrl}/orders/listHMVending`, {}, this.getAuthHeaders());
    }

    load_history(): Observable<any> {
      return this.http.post(`${this.apiUrl}/orders/listHMVending?q=complete`, {}, this.getAuthHeaders());
    }

    controlbyorder(id:number): Observable<any> {
      return this.http.post(`${this.apiUrl}/devices/controlbyorder_hmvending/${id}`, {}, this.getAuthHeaders());
    }
}
