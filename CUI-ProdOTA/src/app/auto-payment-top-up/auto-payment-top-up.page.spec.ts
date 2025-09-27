import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AutoPaymentTopUpPage } from './auto-payment-top-up.page';

describe('AutoPaymentTopUpPage', () => {
  let component: AutoPaymentTopUpPage;
  let fixture: ComponentFixture<AutoPaymentTopUpPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoPaymentTopUpPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
