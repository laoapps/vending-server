import { TestBed } from '@angular/core/testing';

import { BlockchainDb } from './blockchain-db';

describe('BlockchainDb', () => {
  let service: BlockchainDb;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BlockchainDb);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
