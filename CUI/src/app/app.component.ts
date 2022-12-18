import { Component } from '@angular/core';
import { ApiService } from './services/api.service';
import { IAlive } from './services/syste.model';
import * as moment from 'moment';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  checkOnlineStatus:IAlive;
  uT=new Date();
  now = new Date();
  constructor(public apiService:ApiService) {
    
this.checkOnlineStatus= apiService.wsAlive;
    // alert('DEMO started')
    setInterval(()=>{
      this.now = new Date();
    },1000)
    setInterval(()=>{
      this.uT=this.apiService.updateOnlineStatus();
      console.log(this.uT);
      
    },5000)
    
  }
}
