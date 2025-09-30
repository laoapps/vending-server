import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GivePopUpPage } from './give-pop-up.page';

describe('GivePopUpPage', () => {
  let component: GivePopUpPage;
  let fixture: ComponentFixture<GivePopUpPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GivePopUpPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
