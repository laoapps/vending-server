import { TestBed } from '@angular/core/testing';

import { VendingAPIService } from './vending-api.service';

describe('VendingAPIService', () => {
  let service: VendingAPIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VendingAPIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
