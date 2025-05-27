import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MmoneyIosAndroidDownloadPage } from './mmoney-ios-android-download.page';

describe('MmoneyIosAndroidDownloadPage', () => {
  let component: MmoneyIosAndroidDownloadPage;
  let fixture: ComponentFixture<MmoneyIosAndroidDownloadPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(MmoneyIosAndroidDownloadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
