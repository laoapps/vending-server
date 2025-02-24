import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendingGoPage } from './vending-go.page';

describe('VendingGoPage', () => {
  let component: VendingGoPage;
  let fixture: ComponentFixture<VendingGoPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(VendingGoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
