import { TestBed } from '@angular/core/testing';

import { SerialserviceService } from './serialservice.service';

describe('SerialserviceService', () => {
  let service: SerialserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SerialserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
