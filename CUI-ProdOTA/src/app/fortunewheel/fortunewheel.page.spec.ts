import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FortunewheelPage } from './fortunewheel.page';

describe('FortunewheelPage', () => {
  let component: FortunewheelPage;
  let fixture: ComponentFixture<FortunewheelPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(FortunewheelPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
