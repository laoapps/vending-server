import { TestBed } from '@angular/core/testing';

import { WsapiService } from './wsapi.service';

describe('WsapiService', () => {
  let service: WsapiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WsapiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
