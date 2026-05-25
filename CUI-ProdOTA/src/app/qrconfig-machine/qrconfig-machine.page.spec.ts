import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QrconfigMachinePage } from './qrconfig-machine.page';

describe('QrconfigMachinePage', () => {
  let component: QrconfigMachinePage;
  let fixture: ComponentFixture<QrconfigMachinePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QrconfigMachinePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
