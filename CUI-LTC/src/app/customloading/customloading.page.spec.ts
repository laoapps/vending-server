import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomloadingPage } from './customloading.page';

describe('CustomloadingPage', () => {
  let component: CustomloadingPage;
  let fixture: ComponentFixture<CustomloadingPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(CustomloadingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
