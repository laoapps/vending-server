
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  registerOwner(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register-owner`, { token });
  }

  getUserRole(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/role`, this.getAuthHeaders());
  }

  createDevice(name: string, tasmotaId: string, zone?: string, groupId?: number, description?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/devices`, { name, tasmotaId, zone, groupId, description }, this.getAuthHeaders());
  }

  getDevices(): Observable<any> {
    return this.http.get(`${this.apiUrl}/devices`, this.getAuthHeaders());
  }
  //user
  // getDevicesBy(data): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/devices/getDevicesBy`,data, this.getAuthHeaders());
  // }

  orders(data): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders/hmvending`, data, this.getAuthHeaders());
  }
  owners_detail(): Observable<any> {
    return this.http.get(`${this.apiUrl}/owners/findByID`, this.getAuthHeaders());
  }

  updateDevice(id: number, name: string, tasmotaId: string, zone?: string, groupId?: number, description?: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/devices/${id}`, { name, tasmotaId, zone, groupId, description }, this.getAuthHeaders());
  }

  deleteDevice(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/devices/${id}`, this.getAuthHeaders());
  }

  controlDevice(deviceId: number, command: string, relay: number = 1): Observable<any> {
    return this.http.post(`${this.apiUrl}/devices/control`, { deviceId, command, relay }, this.getAuthHeaders());
  }
  getActiveOrdersByDeviceID(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders/getActiveOrdersByDeviceID/${id}`, {}, this.getAuthHeaders());
  }
  // load_order(): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/orders/list`, {}, this.getAuthHeaders());
  // }
  // load_history(): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/orders/list?q=complete`, {}, this.getAuthHeaders());
  // }
  // controlbyorder(id:number): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/devices/controlbyorder/${id}`, {}, this.getAuthHeaders());
  // }

  assignDevice(deviceId: number, userPhoneNumber: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/devices/assign`, { deviceId, userPhoneNumber }, this.getAuthHeaders());
  }
  //user
  // load_all_group(): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/groups/loadAll`, { }, this.getAuthHeaders());
  // }
  createGroup(data): Observable<any> {
    return this.http.post(`${this.apiUrl}/groups`, data, this.getAuthHeaders());
  }
  EditGroup(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/groups/${id}`, data, this.getAuthHeaders());
  }

  getGroups(): Observable<any> {
    return this.http.get(`${this.apiUrl}/groups`, this.getAuthHeaders());
  }

  updateGroup(id: number, name: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/groups/${id}`, { name }, this.getAuthHeaders());
  }

  deleteGroup(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/groups/${id}`, this.getAuthHeaders());
  }

  assignDeviceToGroup(groupId: number, deviceId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/groups/assign`, { groupId, deviceId }, this.getAuthHeaders());
  }

  createSchedule(deviceId: number, type: string, cron?: string, command?: string, conditionType?: string, conditionValue?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/schedules`, { deviceId, type, cron, command, conditionType, conditionValue }, this.getAuthHeaders());
  }

  getSchedules(): Observable<any> {
    return this.http.get(`${this.apiUrl}/schedules`, this.getAuthHeaders());
  }

  updateSchedule(id: number, type: string, cron?: string, command?: string, conditionType?: string, conditionValue?: number, active?: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/schedules/${id}`, { type, cron, command, conditionType, conditionValue, active }, this.getAuthHeaders());
  }

  deleteSchedule(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/schedules/${id}`, this.getAuthHeaders());
  }

  applySchedulePackage(deviceId: number, packageId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/schedule-packages/apply-package`, { deviceId, packageId }, this.getAuthHeaders());
  }

  createSchedulePackage(name: string, price: number, conditionType: string, conditionValue: number, description: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/schedule-packages`, { name, price, conditionType, conditionValue, description }, this.getAuthHeaders());
  }
  editSchedulePackage(id: number, name: string, price: number, conditionType: string, conditionValue: number, description: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/schedule-packages/${id}`, { name, price, conditionType, conditionValue, description }, this.getAuthHeaders());
  }

  getSchedulePackages(): Observable<any> {
    return this.http.get(`${this.apiUrl}/schedule-packages`, this.getAuthHeaders());
  }
  // schedulepackages(ownerID:number): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/schedule-packages/findByOwnerID/${ownerID}`, this.getAuthHeaders());
  // }
  // findByPackageIDs(data:any): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/schedule-packages/findByPackageIDs`,data, this.getAuthHeaders());
  // }

  updateSchedulePackage(id: number, name: string, durationMinutes?: number, powerConsumptionWatts?: number, price?: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/schedule-packages/${id}`, { name, durationMinutes, powerConsumptionWatts, price }, this.getAuthHeaders());
  }

  deleteSchedulePackage(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/schedule-packages/${id}`, this.getAuthHeaders());
  }

  getUnregisteredDevices(): Observable<any> {
    return this.http.get(`${this.apiUrl}/unregistered-devices`, this.getAdminHeaders());
  }

  banUnregisteredDevice(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/unregistered-devices/${id}/ban`, {}, this.getAdminHeaders());
  }

  unbanUnregisteredDevice(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/unregistered-devices/${id}/unban`, {}, this.getAdminHeaders());
  }

  getAllData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin`, this.getAdminHeaders());
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    const owner_role = localStorage.getItem('ownerHeader');
    if (owner_role) {
      return {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'X-owner': 'true',
        }),
      };
    } else {
      return {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      };
    }

  }

  private getAdminHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'X-Admin-Key': 'super-admin',
      }),
    };
  }
}
