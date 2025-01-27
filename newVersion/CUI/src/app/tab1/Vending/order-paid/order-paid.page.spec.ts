import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderPaidPage } from './order-paid.page';

describe('OrderPaidPage', () => {
  let component: OrderPaidPage;
  let fixture: ComponentFixture<OrderPaidPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(OrderPaidPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
