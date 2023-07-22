import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MmoneyCashoutPage } from './mmoney-cashout.page';

describe('MmoneyCashoutPage', () => {
  let component: MmoneyCashoutPage;
  let fixture: ComponentFixture<MmoneyCashoutPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(MmoneyCashoutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
