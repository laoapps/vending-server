import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HangmiStoreSegmentPage } from './hangmi-store-segment.page';

describe('HangmiStoreSegmentPage', () => {
  let component: HangmiStoreSegmentPage;
  let fixture: ComponentFixture<HangmiStoreSegmentPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(HangmiStoreSegmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
