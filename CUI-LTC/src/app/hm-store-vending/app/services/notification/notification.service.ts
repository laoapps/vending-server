import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Notification {
  message: string;
  orderId: number;
  deviceId: number;
  userUuid: string;
  ownerId: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationSubject.asObservable();
  // private wsUrl = environment.wsUrl; // e.g., 'wss://tasmota-api.laoapps.com:31884'
  private socket: WebSocket | null = null;

  constructor() {}

  connect(userUuid: string, token: string): void {
    if (this.socket) {
      this.disconnect();
    }

    try {
      // const url = `${this.wsUrl}/ws?type=user&token=${token}&uuid=${userUuid}`;
      // this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('WebSocket connected for user:', userUuid);
      };

      this.socket.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          const currentNotifications = this.notificationSubject.getValue();
          this.notificationSubject.next([...currentNotifications, notification]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.socket = null;
        this.reconnect(userUuid, token);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.reconnect(userUuid, token);
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.reconnect(userUuid, token);
    }
  }

  private reconnect(userUuid: string, token: string): void {
    setTimeout(() => this.connect(userUuid, token), 5000);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications$;
  }

  clearNotifications(): void {
    this.notificationSubject.next([]);
  }
}