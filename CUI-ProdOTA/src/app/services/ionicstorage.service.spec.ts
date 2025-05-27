import { TestBed } from '@angular/core/testing';

import { IonicstorageService } from './ionicstorage.service';

describe('IonicstorageService', () => {
  let service: IonicstorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IonicstorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
