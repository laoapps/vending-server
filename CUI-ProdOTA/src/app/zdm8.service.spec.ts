import { TestBed } from '@angular/core/testing';

import { Zdm8Service } from './zdm8.service';

describe('Zdm8Service', () => {
  let service: Zdm8Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Zdm8Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
