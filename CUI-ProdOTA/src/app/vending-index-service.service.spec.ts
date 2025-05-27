import { TestBed } from '@angular/core/testing';

import { VendingIndexServiceService } from './vending-index-service.service';

describe('VendingIndexServiceService', () => {
  let service: VendingIndexServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VendingIndexServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
