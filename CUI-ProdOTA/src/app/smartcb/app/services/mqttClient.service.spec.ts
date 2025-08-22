import { TestBed } from '@angular/core/testing';

import { MqttClientService } from './mqttClient.service';

describe('MqttService', () => {
  let service: MqttClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MqttClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
