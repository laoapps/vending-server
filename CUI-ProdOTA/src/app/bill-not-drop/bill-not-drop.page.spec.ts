import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BillNotDropPage } from './bill-not-drop.page';

describe('BillNotDropPage', () => {
  let component: BillNotDropPage;
  let fixture: ComponentFixture<BillNotDropPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BillNotDropPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
