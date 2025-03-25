import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScratchingPage } from './scratching.page';

describe('ScratchingPage', () => {
  let component: ScratchingPage;
  let fixture: ComponentFixture<ScratchingPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(ScratchingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
