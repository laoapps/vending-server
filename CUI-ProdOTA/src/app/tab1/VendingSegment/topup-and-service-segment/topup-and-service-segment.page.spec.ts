import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopupAndServiceSegmentPage } from './topup-and-service-segment.page';

describe('TopupAndServiceSegmentPage', () => {
  let component: TopupAndServiceSegmentPage;
  let fixture: ComponentFixture<TopupAndServiceSegmentPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(TopupAndServiceSegmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
