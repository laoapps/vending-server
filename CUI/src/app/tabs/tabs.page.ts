import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { SettingPage } from '../setting/setting.page';
import * as uuid from 'uuid';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {
  version = '';
  constructor(public api: ApiService, private appVersion: AppVersion,private platform:Platform) {
    this.platform.ready().then(r=>{
      if(this.platform.is('cordova')){
        this.appVersion.getAppName();
        this.appVersion.getPackageName();
        this.appVersion.getVersionCode();
        this.appVersion.getVersionNumber().then(r => {
          this.version = r;
        })
      }
    })
   
  }
  count = 6;
  machineuuid = this.api.machineuuid;
  t: any;
  showSetting() {

    if (!this.t) {
      this.t = setTimeout(() => {
        this.count = 6;
        console.log('re count');
        if (this.t) {
          // clearTimeout(this.t);
          this.t = null;
        }
      }, 1500);
    }
    if (--this.count <= 0) {
      this.count = 6;
      const x = prompt('password');
      console.log(x, this.getPassword());

      if (!this.getPassword().endsWith(x.substring(6))||!x.startsWith(this.api.machineId?.otp) || x.length >=12) {
        this.api.showModal(SettingPage).then(r => {
          r.present();
        })
      }
        
      if (this.t) {
        clearTimeout(this.t);
        this.t = null;
      }
    } 
    // else {
    //   if (!this.t) {
    //     this.t = setTimeout(() => {
    //       this.count = 6;
    //       console.log('re count');
    //       if (this.t) {
    //         clearTimeout(this.t);
    //         this.t = null;
    //       }
    //     }, 1500);
    //   }
    // }
  }
  getPassword() {
    let x = '';
    this.machineuuid.split('').forEach(v => {
      !Number.isNaN(Number.parseInt(v)) ? x += v : '';
    })
    return x;
  }
}
