import { TestBed } from '@angular/core/testing';

import { EsspNV9USBService } from './essp-nv9-usb.service';

describe('EsspNV9USBService', () => {
  let service: EsspNV9USBService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EsspNV9USBService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
