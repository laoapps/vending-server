import { Component } from '@angular/core';
import { ApiService } from './services/api.service';
import { IAlive } from './services/syste.model';

import * as moment from 'moment';

import { Platform } from '@ionic/angular';
import { SettingPage } from './setting/setting.page';
// import { ScreenBrightness } from '@capacitor-community/screen-brightness';
import { LiveUpdate } from '@capawesome/capacitor-live-update';
import { VendingIndexServiceService } from './vending-index-service.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  checkOnlineStatus: IAlive;
  uT = new Date();
  now = new Date();
  version = '7';
  count = 6;
  machineuuid = this.apiService.machineuuid;
  t: any;
  // constructor(public apiService: ApiService,  private platform: Platform) {
  //   this.platform.ready().then(r => {

  //   })

  //   this.checkOnlineStatus = apiService.wsAlive;
  //   // alert('DEMO started')
  //   setInterval(() => {
  //     this.now = new Date();
  //   }, 1000)
  //   setInterval(() => {
  //     this.uT = this.apiService.updateOnlineStatus();
  //     // console.log(this.uT);

  //   }, 5000)

  // }
  constructor(
    public apiService: ApiService,
    private platform: Platform,
    public vendingIndex: VendingIndexServiceService
  ) {
    this.platform.ready().then(() => {
      this.initializeApp();
    });

    this.checkOnlineStatus = apiService.wsAlive;
    setInterval(() => {
      this.now = new Date();
    }, 1000);
    setInterval(() => {
      this.uT = this.apiService.updateOnlineStatus();
    }, 5000);
  }

  async initializeApp() {
    await this.checkForLiveUpdate(); // Check for updates on app start

  }

  async checkForLiveUpdate() {
    try {
      // Sync with the server to check and download updates
      const result = await LiveUpdate.sync();
      console.log('LiveUpdate sync result:', result);

      // Check if a new bundle was downloaded
      if (result.nextBundleId) {
        console.log('New update applied, reloading app...');
        // await LiveUpdate.reload(); // Reload the app to apply the update
        console.log('App reloaded with the new update');
      } else {
        console.log('No update available or no change needed');
      }
    } catch (error) {
      console.error('Error during live update sync:', error);
    }
  }

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

      if (!this.getPassword().endsWith(x.substring(6)) || !x.startsWith(this.apiService.machineId?.otp) || x.length < 12) return;
      this.apiService.showModal(SettingPage).then(r => {
        r.present();
      })

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
  autoCheckAppVersion() {
    this.apiService.checkAppVersion.subscribe(run => {
      if (!run) return;
      // (document.querySelector('.statusbar') as HTMLDivElement).style.zIndex = '-1';
      console.log(`CHECK APP VERSION`, run);
    });
  }
  startActive() {
    const hour = new Date().getHours();// >19 , >0&&<8
    // ScreenBrightness.setBrightness({ brightness:1 });
  }
}

