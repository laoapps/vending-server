import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QrOpenStockPage } from './qr-open-stock.page';

describe('QrOpenStockPage', () => {
  let component: QrOpenStockPage;
  let fixture: ComponentFixture<QrOpenStockPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QrOpenStockPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
