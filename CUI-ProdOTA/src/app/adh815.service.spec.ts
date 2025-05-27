import { TestBed } from '@angular/core/testing';

import { ADH815Service } from './adh815.service';

describe('ADH815Service', () => {
  let service: ADH815Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ADH815Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
