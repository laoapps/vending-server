import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlOrderPage } from './control-order.page';

describe('ControlOrderPage', () => {
  let component: ControlOrderPage;
  let fixture: ComponentFixture<ControlOrderPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlOrderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
