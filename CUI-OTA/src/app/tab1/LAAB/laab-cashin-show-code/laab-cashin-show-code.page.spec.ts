import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { LaabCashinShowCodePage } from './laab-cashin-show-code.page';

describe('LaabCashinShowCodePage', () => {
  let component: LaabCashinShowCodePage;
  let fixture: ComponentFixture<LaabCashinShowCodePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LaabCashinShowCodePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(LaabCashinShowCodePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
