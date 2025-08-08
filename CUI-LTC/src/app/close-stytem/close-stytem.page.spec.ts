import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CloseStytemPage } from './close-stytem.page';

describe('CloseStytemPage', () => {
  let component: CloseStytemPage;
  let fixture: ComponentFixture<CloseStytemPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CloseStytemPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
