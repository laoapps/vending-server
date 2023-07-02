import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HowToPage } from './how-to.page';

describe('HowToPage', () => {
  let component: HowToPage;
  let fixture: ComponentFixture<HowToPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(HowToPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
