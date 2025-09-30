import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddDevicesPage } from './add-devices.page';

describe('AddDevicesPage', () => {
  let component: AddDevicesPage;
  let fixture: ComponentFixture<AddDevicesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddDevicesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
