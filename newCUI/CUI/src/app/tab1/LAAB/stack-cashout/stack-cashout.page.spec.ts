import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StackCashoutPage } from './stack-cashout.page';

describe('StackCashoutPage', () => {
  let component: StackCashoutPage;
  let fixture: ComponentFixture<StackCashoutPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(StackCashoutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
