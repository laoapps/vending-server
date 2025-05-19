import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpaceInvadersPage } from './space-invaders.page';

describe('SpaceInvadersPage', () => {
  let component: SpaceInvadersPage;
  let fixture: ComponentFixture<SpaceInvadersPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(SpaceInvadersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
