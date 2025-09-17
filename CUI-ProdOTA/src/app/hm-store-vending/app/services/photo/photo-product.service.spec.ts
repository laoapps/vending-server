import { TestBed } from '@angular/core/testing';

import { PhotoProductService } from './photo-product.service';

describe('PhotoProductService', () => {
  let service: PhotoProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhotoProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
