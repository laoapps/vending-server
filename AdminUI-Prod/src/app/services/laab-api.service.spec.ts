import { TestBed } from '@angular/core/testing';

import { LaabApiService } from './laab-api.service';

describe('LaabApiService', () => {
  let service: LaabApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LaabApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
