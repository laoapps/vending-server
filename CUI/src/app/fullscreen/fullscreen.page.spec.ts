import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FullscreenPage } from './fullscreen.page';

describe('FullscreenPage', () => {
  let component: FullscreenPage;
  let fixture: ComponentFixture<FullscreenPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(FullscreenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
