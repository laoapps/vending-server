import { Component } from '@angular/core';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  checkOnlineStatus:()=>boolean;
  constructor(public apiService:ApiService) {
this.checkOnlineStatus= apiService.checkOnlineStatus;
  }
}
