import { TestBed } from '@angular/core/testing';

import { LiveupdateService } from './liveupdate.service';

describe('LiveupdateService', () => {
  let service: LiveupdateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiveupdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
