import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddPageketsPage } from './add-pagekets.page';

describe('AddPageketsPage', () => {
  let component: AddPageketsPage;
  let fixture: ComponentFixture<AddPageketsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPageketsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
