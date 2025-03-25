import { TestBed } from '@angular/core/testing';

import { ControlMenuService } from './control-menu.service';

describe('ControlMenuService', () => {
  let service: ControlMenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ControlMenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
