import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserSchedulePage } from './user-schedule.page';

describe('UserSchedulePage', () => {
  let component: UserSchedulePage;
  let fixture: ComponentFixture<UserSchedulePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UserSchedulePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
