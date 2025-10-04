import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PayQrPage } from './pay-qr.page';

describe('PayQrPage', () => {
  let component: PayQrPage;
  let fixture: ComponentFixture<PayQrPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PayQrPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
