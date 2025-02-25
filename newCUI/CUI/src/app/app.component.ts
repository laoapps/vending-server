import { Component } from '@angular/core';
import { ApiService } from './services/api.service';
import { IAlive } from './services/syste.model';
import { App } from '@capacitor/app';
import * as moment from 'moment';

import { Platform } from '@ionic/angular';
import { SettingPage } from './setting/setting.page';
import { EVendingIndex, VendingIndexServiceService } from './vending-index-service.service';



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
  constructor(public apiService: ApiService,  private platform: Platform,public vendingIndex: VendingIndexServiceService) {
    this.platform.ready().then(r => {
      this.initializeApp();
    })

    this.checkOnlineStatus = apiService.wsAlive;
    // alert('DEMO started')
    setInterval(() => {
      this.now = new Date();
    }, 1000)
    setInterval(() => {
      this.uT = this.apiService.updateOnlineStatus();
      // console.log(this.uT);

    }, 5000)

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

      // if (!this.getPassword().endsWith(x.substring(6))||!x.startsWith(this.apiService.machineId?.otp) || x.length < 12) return;
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
  initializeApp() {
    // Detect when the app goes to background
    App.addListener('pause', async () => {
      console.log('App moved to background, closing port...');
      this.closePort();  // Function to close the port
    });

    // Detect when the app is resumed
    App.addListener('resume', async () => {
      console.log('App resumed');
      this.reopenPort();  // Function to reopen the port if needed
    });

    // Detect when the app is about to close
    App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        console.log('App is inactive, closing port...');
        this.closePort();
      }
    });


  }

  // Example function to close the port
  private closePort() {
    try {
      // Close the port logic here
      console.log('Port closed successfully.');
    } catch (error) {
      console.error('Error closing port:', error);
    }
  }

  // Example function to reopen the port (if needed)
  private reopenPort() {
    try {
      // Reopen the port logic if needed
      let vendingName = localStorage.getItem('vendingName')
      if(!vendingName){
        localStorage.setItem('vendingName',EVendingIndex.zdm8+'');
        vendingName=EVendingIndex.zdm8+'';
      }
      if(vendingName==EVendingIndex.zdm8+''){
        this.vendingIndex.initZDM8(localStorage.getItem('portName'),parseInt(localStorage.getItem('braudRate')));
      }else if(vendingName==EVendingIndex.vmc+''){
        this.vendingIndex.initVMC(localStorage.getItem('portName'),parseInt(localStorage.getItem('braudRate')));
      }
   
      console.log('Reopening port if necessary...');
    } catch (error) {
      console.error('Error reopening port:', error);
    }
  }
}

