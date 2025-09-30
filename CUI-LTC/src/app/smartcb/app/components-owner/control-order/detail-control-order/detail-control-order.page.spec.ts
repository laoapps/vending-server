import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetailControlOrderPage } from './detail-control-order.page';

describe('DetailControlOrderPage', () => {
  let component: DetailControlOrderPage;
  let fixture: ComponentFixture<DetailControlOrderPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailControlOrderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
