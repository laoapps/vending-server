import { TestBed } from '@angular/core/testing';

import { Vmc2Service } from './vmc2.service';

describe('Vmc2Service', () => {
  let service: Vmc2Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Vmc2Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
