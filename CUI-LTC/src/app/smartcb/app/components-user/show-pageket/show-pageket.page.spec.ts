import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowPageketPage } from './show-pageket.page';

describe('ShowPageketPage', () => {
  let component: ShowPageketPage;
  let fixture: ComponentFixture<ShowPageketPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPageketPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
