import { TestBed } from '@angular/core/testing';

import { CCTALKTb74Service } from './cctalktb74.service';

describe('CCTALKTb74Service', () => {
  let service: CCTALKTb74Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CCTALKTb74Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
