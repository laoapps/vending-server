import { TestBed } from '@angular/core/testing';

import { Checkpoint } from './checkpoint';

describe('Checkpoint', () => {
  let service: Checkpoint;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Checkpoint);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
