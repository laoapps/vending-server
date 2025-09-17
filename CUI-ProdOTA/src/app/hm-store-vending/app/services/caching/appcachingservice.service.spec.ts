import { TestBed } from '@angular/core/testing';

import { AppcachingserviceService } from './appcachingservice.service';

describe('AppcachingserviceService', () => {
  let service: AppcachingserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppcachingserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
