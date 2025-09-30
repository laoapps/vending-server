import { TestBed } from '@angular/core/testing';

import { ApiVendingService } from './api-vending.service';

describe('ApiVendingService', () => {
  let service: ApiVendingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiVendingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
