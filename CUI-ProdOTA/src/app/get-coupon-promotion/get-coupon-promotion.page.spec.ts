import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GetCouponPromotionPage } from './get-coupon-promotion.page';

describe('GetCouponPromotionPage', () => {
  let component: GetCouponPromotionPage;
  let fixture: ComponentFixture<GetCouponPromotionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GetCouponPromotionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
