import { TestBed } from '@angular/core/testing';

import { Tp77p3bcashacceptorService } from './tp77p3bcashacceptor.service';

describe('Tp77p3bcashacceptorService', () => {
  let service: Tp77p3bcashacceptorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Tp77p3bcashacceptorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
