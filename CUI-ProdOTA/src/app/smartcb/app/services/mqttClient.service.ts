import { Injectable } from '@angular/core';
import { IMqttMessage, MqttService, IMqttServiceOptions } from 'ngx-mqtt';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MqttClientService {
  private client: MqttService;

  constructor() {
    const options: IMqttServiceOptions = {
      hostname: environment.mqtt.hostname,
      port: environment.mqtt.port,
      protocol: environment.mqtt.protocol as any,
      username: environment.mqtt.username,
      password: environment.mqtt.password,
    };
    this.client = new MqttService(options);
  }

  subscribeToDevice(tasmotaId: string): Observable<IMqttMessage> {
    return this.client.observe(`stat/${tasmotaId}/+`);
  }

  subscribeToTelemetry(tasmotaId: string): Observable<IMqttMessage> {
    return this.client.observe(`tele/${tasmotaId}/+`);
  }
}