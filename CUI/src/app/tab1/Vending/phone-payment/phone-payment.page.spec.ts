import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhonePaymentPage } from './phone-payment.page';

describe('PhonePaymentPage', () => {
  let component: PhonePaymentPage;
  let fixture: ComponentFixture<PhonePaymentPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(PhonePaymentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
