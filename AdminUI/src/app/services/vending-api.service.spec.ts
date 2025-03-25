import { TestBed } from '@angular/core/testing';

import { VendingApiService } from './vending-api.service';

describe('VendingApiService', () => {
  let service: VendingApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VendingApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
