import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AutoPaymentPage } from './auto-payment.page';

describe('AutoPaymentPage', () => {
  let component: AutoPaymentPage;
  let fixture: ComponentFixture<AutoPaymentPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AutoPaymentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
