import { TestBed } from '@angular/core/testing';

import { Indexsavesale } from './indexsavesale';

describe('Indexsavesale', () => {
  let service: Indexsavesale;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Indexsavesale);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
