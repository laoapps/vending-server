import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TestmotorPage } from './testmotor.page';

describe('TestmotorPage', () => {
  let component: TestmotorPage;
  let fixture: ComponentFixture<TestmotorPage>;

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(TestmotorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
