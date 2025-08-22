import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenQrCodePage } from './gen-qr-code.page';

describe('GenQrCodePage', () => {
  let component: GenQrCodePage;
  let fixture: ComponentFixture<GenQrCodePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GenQrCodePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
