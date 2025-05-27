import { TestBed } from '@angular/core/testing';

import { VendingZDM8Service } from './vending-zdm8.service';

describe('VendingZDM8Service', () => {
  let service: VendingZDM8Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VendingZDM8Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
