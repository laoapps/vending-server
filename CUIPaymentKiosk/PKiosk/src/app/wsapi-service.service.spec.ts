import { TestBed } from '@angular/core/testing';

import { WsapiServiceService } from './wsapi-service.service';

describe('WsapiServiceService', () => {
  let service: WsapiServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WsapiServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
