import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddGroupsPage } from './add-groups.page';

describe('AddGroupsPage', () => {
  let component: AddGroupsPage;
  let fixture: ComponentFixture<AddGroupsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddGroupsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
