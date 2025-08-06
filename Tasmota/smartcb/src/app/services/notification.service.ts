import { Injectable } from '@angular/core';
import { WebSocket } from 'ws';
import { BehaviorSubject, Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';

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
  private wsUrl = 'wss://your-server:31884'; // Replace with your server URL
  private socket: any = null;

  constructor() {}

  async connect(userUuid: string, token: string): Promise<void> {
    if (this.socket) {
      await this.disconnect();
    }
    const ws = new WebSocket(`${this.wsUrl}/ws?type=user&token=${token}&uuid=${userUuid}`);
    try {
      const url = `${this.wsUrl}/ws?type=user&token=${token}&uuid=${userUuid}`;
      this.socket = new  WebSocket(url);

      await this.socket .addListener('message', (event: any) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          const currentNotifications = this.notificationSubject.getValue();
          this.notificationSubject.next([...currentNotifications, notification]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      await this.socket .addListener('close', () => {
        console.log('WebSocket disconnected');
        this.socket = null;
      });

      await this.socket .addListener('error', (error: any) => {
        console.error('WebSocket error:', error);
        this.reconnect(userUuid, token);
      });

      console.log('WebSocket connected for user:', userUuid);
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.reconnect(userUuid, token);
    }
  }

  private async reconnect(userUuid: string, token: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      setTimeout(() => this.connect(userUuid, token), 5000); // Retry after 5 seconds
    }
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      await this.socket .disconnect();
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