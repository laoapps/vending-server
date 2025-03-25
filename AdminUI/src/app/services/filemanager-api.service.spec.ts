import { TestBed } from '@angular/core/testing';

import { FilemanagerApiService } from './filemanager-api.service';

describe('FilemanagerApiService', () => {
  let service: FilemanagerApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilemanagerApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
