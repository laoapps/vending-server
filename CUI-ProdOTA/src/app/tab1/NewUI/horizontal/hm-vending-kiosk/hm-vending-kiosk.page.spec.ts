import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HmVendingKioskPage } from './hm-vending-kiosk.page';

describe('HmVendingKioskPage', () => {
  let component: HmVendingKioskPage;
  let fixture: ComponentFixture<HmVendingKioskPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HmVendingKioskPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
