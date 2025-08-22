import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserSchedulesPage } from './user-schedule.page';

describe('UserSchedulePage', () => {
  let component: UserSchedulesPage;
  let fixture: ComponentFixture<UserSchedulesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UserSchedulesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
