import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlDevicePage } from './control-device.page';

describe('ControlDevicePage', () => {
  let component: ControlDevicePage;
  let fixture: ComponentFixture<ControlDevicePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlDevicePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
