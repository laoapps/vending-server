import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopupServicePage } from './topup-service.page';

describe('TopupServicePage', () => {
  let component: TopupServicePage;
  let fixture: ComponentFixture<TopupServicePage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(TopupServicePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
