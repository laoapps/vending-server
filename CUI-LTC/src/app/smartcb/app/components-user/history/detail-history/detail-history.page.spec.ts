import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetailHistoryPage } from './detail-history.page';

describe('DetailHistoryPage', () => {
  let component: DetailHistoryPage;
  let fixture: ComponentFixture<DetailHistoryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailHistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
