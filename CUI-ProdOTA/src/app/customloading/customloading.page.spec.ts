import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { CustomloadingPage } from './customloading.page';

describe('CustomloadingPage', () => {
  let component: CustomloadingPage;
  let fixture: ComponentFixture<CustomloadingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomloadingPage],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomloadingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
