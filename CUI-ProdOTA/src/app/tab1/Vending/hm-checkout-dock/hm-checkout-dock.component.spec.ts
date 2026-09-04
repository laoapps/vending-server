import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { HmCheckoutDockComponent } from './hm-checkout-dock.component';

describe('HmCheckoutDockComponent', () => {
  let component: HmCheckoutDockComponent;
  let fixture: ComponentFixture<HmCheckoutDockComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HmCheckoutDockComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(HmCheckoutDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
