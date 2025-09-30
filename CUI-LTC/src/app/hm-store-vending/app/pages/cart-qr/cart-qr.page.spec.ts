import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartQrPage } from './cart-qr.page';

describe('CartQrPage', () => {
  let component: CartQrPage;
  let fixture: ComponentFixture<CartQrPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CartQrPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
