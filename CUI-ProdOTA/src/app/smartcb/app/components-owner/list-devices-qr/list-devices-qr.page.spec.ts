import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListDevicesQrPage } from './list-devices-qr.page';

describe('ListDevicesQrPage', () => {
  let component: ListDevicesQrPage;
  let fixture: ComponentFixture<ListDevicesQrPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListDevicesQrPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
