import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopupAndServicePage } from './topup-and-service.page';

describe('TopupAndServicePage', () => {
  let component: TopupAndServicePage;
  let fixture: ComponentFixture<TopupAndServicePage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(TopupAndServicePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
