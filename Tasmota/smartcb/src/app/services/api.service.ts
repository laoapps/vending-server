import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(phoneNumber: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { phoneNumber });
  }

  registerOwner(phoneNumber: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register-owner`, { phoneNumber }, this.getAuthHeaders());
  }

  createDevice(name: string, tasmotaId: string, zone?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/devices`, { name, tasmotaId, zone }, this.getAuthHeaders());
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

  controlDevice(deviceId: number, command: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/devices/control`, { deviceId, command }, this.getAuthHeaders());
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

  getAllData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin`, this.getAuthHeaders());
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }
}