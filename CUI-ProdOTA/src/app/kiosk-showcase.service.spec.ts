import { TestBed } from '@angular/core/testing';

import { KioskShowcaseService } from './kiosk-showcase.service';

describe('KioskShowcaseService', () => {
  let service: KioskShowcaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KioskShowcaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
