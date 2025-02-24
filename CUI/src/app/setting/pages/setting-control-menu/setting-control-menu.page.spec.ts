import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingControlMenuPage } from './setting-control-menu.page';

describe('SettingControlMenuPage', () => {
  let component: SettingControlMenuPage;
  let fixture: ComponentFixture<SettingControlMenuPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(SettingControlMenuPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
