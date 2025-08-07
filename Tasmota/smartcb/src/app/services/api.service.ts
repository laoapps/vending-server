
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

  createDevice(name: string, tasmotaId: string, zone?: string, groupId?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/devices`, { name, tasmotaId, zone, groupId }, this.getAuthHeaders());
  }

  getDevices(): Observable<any> {
    return this.http.get(`${this.apiUrl}/devices`, this.getAuthHeaders());
  }

  updateDevice(id: number, name: string, tasmotaId: string, zone?: string, groupId?: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/devices/${id}`, { name, tasmotaId, zone, groupId }, this.getAuthHeaders());
  }

  deleteDevice(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/devices/${id}`, this.getAuthHeaders());
  }

  controlDevice(deviceId: number, command: string, relay: number = 1): Observable<any> {
    return this.http.post(`${this.apiUrl}/devices/control`, { deviceId, command, relay }, this.getAuthHeaders());
  }

  assignDevice(deviceId: number, userPhoneNumber: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/devices/assign`, { deviceId, userPhoneNumber }, this.getAuthHeaders());
  }

  createGroup(name: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/groups`, { name }, this.getAuthHeaders());
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

  createSchedulePackage(name: string, price: number, conditionType: string, conditionValue: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/schedule-packages`, { name, price, conditionType, conditionValue }, this.getAuthHeaders());
  }
  // createSchedulePackage(name: string, durationMinutes?: number, powerConsumptionWatts?: number, price?: number): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/schedule-packages`, { name, durationMinutes, powerConsumptionWatts, price }, this.getAuthHeaders());
  // }

  getSchedulePackages(): Observable<any> {
    return this.http.get(`${this.apiUrl}/schedule-packages`, this.getAuthHeaders());
  }

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
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
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
