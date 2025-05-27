import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HangmiFoodSegmentPage } from './hangmi-food-segment.page';

describe('HangmiFoodSegmentPage', () => {
  let component: HangmiFoodSegmentPage;
  let fixture: ComponentFixture<HangmiFoodSegmentPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(HangmiFoodSegmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
