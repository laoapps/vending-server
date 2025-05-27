import { TestBed } from '@angular/core/testing';

import { MT102Service } from './mt102.service';

describe('MT102Service', () => {
  let service: MT102Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MT102Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
