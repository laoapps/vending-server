import { TestBed } from '@angular/core/testing';

import { IndexerrorService } from './indexerror.service';

describe('IndexerrorService', () => {
  let service: IndexerrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IndexerrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
