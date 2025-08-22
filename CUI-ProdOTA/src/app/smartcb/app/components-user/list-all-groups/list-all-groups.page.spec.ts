import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListAllGroupsPage } from './list-all-groups.page';

describe('ListAllGroupsPage', () => {
  let component: ListAllGroupsPage;
  let fixture: ComponentFixture<ListAllGroupsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListAllGroupsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
