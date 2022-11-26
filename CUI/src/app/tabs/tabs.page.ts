import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { SettingPage } from '../setting/setting.page';
import * as uuid from 'uuid';
@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {

  constructor(public api:ApiService) {}
  count =6;
  machineuuid=this.api.machineuuid;
  t:any;
  showSetting(){
   
  
    if(--this.count<=0){
      this.count=6;
      const x =prompt('password');
      console.log(x,this.getPassword());
      
      if(this.getPassword().endsWith(x)&&x.length>=6)
      this.api.showModal(SettingPage).then(r=>{
        r.present();
      })
      if(this.t)clearTimeout(this.t);
    }else{
      if(!this.t){
        this.t= setTimeout(() => {
          this.count=6; 
          console.log('re count');
          if(this.t){
            clearTimeout(this.t);
            this.t =null
          }
        }, 3000);
      }
    }
  }
  getPassword(){
    let x = '';
    this.machineuuid.split('').forEach(v=>{
      !Number.isNaN(Number.parseInt(v))?x+=v:'';
    })
    return x;
  }
}
