import { TestBed } from '@angular/core/testing';

import { IndexdblocalService } from './indexdblocal.service';

describe('IndexdblocalService', () => {
  let service: IndexdblocalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IndexdblocalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
