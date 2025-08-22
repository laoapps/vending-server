import { TestBed } from '@angular/core/testing';

import { CaptchaServiceService } from './captcha-service.service';

describe('CaptchaServiceService', () => {
  let service: CaptchaServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CaptchaServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
