import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmcodePage } from './confirmcode.page';

describe('ConfirmcodePage', () => {
  let component: ConfirmcodePage;
  let fixture: ComponentFixture<ConfirmcodePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmcodePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
