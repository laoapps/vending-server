import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUnregisteredDevicesPage } from './admin-unregistered-devices.page';

describe('AdminUnregisteredDevicesPage', () => {
  let component: AdminUnregisteredDevicesPage;
  let fixture: ComponentFixture<AdminUnregisteredDevicesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminUnregisteredDevicesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
