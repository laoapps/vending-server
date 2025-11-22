import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomNumberPadPage } from './custom-number-pad.page';

describe('CustomNumberPadPage', () => {
  let component: CustomNumberPadPage;
  let fixture: ComponentFixture<CustomNumberPadPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomNumberPadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
