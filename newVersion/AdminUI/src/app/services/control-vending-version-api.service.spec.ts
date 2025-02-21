import { TestBed } from '@angular/core/testing';

import { ControlVendingVersionAPIService } from './control-vending-version-api.service';

describe('ControlVendingVersionAPIService', () => {
  let service: ControlVendingVersionAPIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ControlVendingVersionAPIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
