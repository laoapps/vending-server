import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayGamesPage } from './play-games.page';

describe('PlayGamesPage', () => {
  let component: PlayGamesPage;
  let fixture: ComponentFixture<PlayGamesPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(PlayGamesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
