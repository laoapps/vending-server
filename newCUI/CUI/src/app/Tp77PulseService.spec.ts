import { TestBed } from '@angular/core/testing';

import { Tp77PulseService } from './Tp77PulseService';

describe('Tp77PulseService', () => {
  let service: Tp77PulseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Tp77PulseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
