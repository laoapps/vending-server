import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowPackageQrPage } from './show-package-qr.page';

describe('ShowPackageQrPage', () => {
  let component: ShowPackageQrPage;
  let fixture: ComponentFixture<ShowPackageQrPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPackageQrPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
