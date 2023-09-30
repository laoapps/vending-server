import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { OrderCartPage } from './order-cart.page';

describe('OrderCartPage', () => {
  let component: OrderCartPage;
  let fixture: ComponentFixture<OrderCartPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(OrderCartPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
