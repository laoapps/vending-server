import { Component } from '@angular/core';
import { ApiService } from './services/api.service';
import { IAlive } from './services/syste.model';
import * as moment from 'moment';

import { Platform } from '@ionic/angular';
import { SettingPage } from './setting/setting.page';
// import { serialconnectioncapacitor } from 'serialconnectioncapacitor';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  checkOnlineStatus: IAlive;
  uT = new Date();
  now = new Date();
  version = '';
  constructor(public apiService: ApiService, private platform: Platform) {
    this.platform.ready().then(r => {
      // serialconnectioncapacitor.listPorts().then(ports => {
      //   if (Object.keys(ports).length === 0) {
      //     throw new Error('No serial ports available');
      //   }
      //   console.log('ports',ports);
      // }).catch(e => {
      //   console.log(e);
      // });

      this.autoCheckAppVersion();

    });

    this.checkOnlineStatus = apiService.wsAlive;
    // alert('DEMO started')
    setInterval(() => {
      this.now = new Date();
    }, 1000);
    setInterval(() => {
      this.uT = this.apiService.updateOnlineStatus();
      // console.log(this.uT);

    }, 5000);

  }
  count = 6;
  machineuuid = this.apiService.machineuuid;
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

      if (!this.getPassword().endsWith(x.substring(6))||!x.startsWith(this.apiService.machineId?.otp) || x.length < 12) {return;}
        this.apiService.showModal(SettingPage).then(r => {
          r.present();
        });

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
      !isNaN(parseInt(v)) ? x += v : '';
    });
    return x;
  }
  autoCheckAppVersion() {
    this.apiService.checkAppVersion.subscribe(run => {
      if (!run) {return;}
      // (document.querySelector('.statusbar') as HTMLDivElement).style.zIndex = '-1';
      console.log(`CHECK APP VERSION`, run);
    });
  }
  startActive(){
    const hour = new Date().getHours();// >19 , >0&&<8
    // ScreenBrightness.setBrightness({ brightness:1 });
  }
}

