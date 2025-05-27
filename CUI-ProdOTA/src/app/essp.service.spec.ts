import { TestBed } from '@angular/core/testing';

import { EsspService } from './essp.service';

describe('EsspNV9USBService', () => {
  let service: EsspService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EsspService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
