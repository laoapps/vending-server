import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowDevicesPage } from './show-devices.page';

describe('ShowDevicesPage', () => {
  let component: ShowDevicesPage;
  let fixture: ComponentFixture<ShowDevicesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowDevicesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
