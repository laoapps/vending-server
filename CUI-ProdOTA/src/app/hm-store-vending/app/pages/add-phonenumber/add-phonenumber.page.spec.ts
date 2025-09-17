import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddPhonenumberPage } from './add-phonenumber.page';

describe('AddPhonenumberPage', () => {
  let component: AddPhonenumberPage;
  let fixture: ComponentFixture<AddPhonenumberPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPhonenumberPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
