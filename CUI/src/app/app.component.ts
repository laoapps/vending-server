import { Component } from '@angular/core';
import { ApiService } from './services/api.service';
import { IAlive } from './services/syste.model';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  checkOnlineStatus:IAlive;
  constructor(public apiService:ApiService) {
this.checkOnlineStatus= apiService.wsAlive;
    alert('DEMO started')
  }
}
