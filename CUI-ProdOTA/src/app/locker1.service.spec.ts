import { TestBed } from '@angular/core/testing';

import { Locker1Service } from './locker1.service';

describe('Locker1Service', () => {
  let service: Locker1Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Locker1Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
