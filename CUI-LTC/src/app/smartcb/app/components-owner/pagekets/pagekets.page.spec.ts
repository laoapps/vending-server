import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageketsPage } from './pagekets.page';

describe('PageketsPage', () => {
  let component: PageketsPage;
  let fixture: ComponentFixture<PageketsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PageketsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
