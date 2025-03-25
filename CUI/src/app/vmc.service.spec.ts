import { TestBed } from '@angular/core/testing';

import { VmcService } from './vmc.service';

describe('VmcService', () => {
  let service: VmcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VmcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
