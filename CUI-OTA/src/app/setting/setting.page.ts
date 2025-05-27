import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { SettingControlMenuPage } from './pages/setting-control-menu/setting-control-menu.page';
import { environment } from 'src/environments/environment';
import { IENMessage } from '../models/base.model';
import axios from 'axios';
import { IonicStorageService } from '../ionic-storage.service';
import { AppcachingserviceService } from '../services/appcachingservice.service';
import { TestmotorPage } from '../testmotor/testmotor.page';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
})
export class SettingPage implements OnInit, OnDestroy {
  wsurl = localStorage.getItem('wsurl') || environment.wsurl;
  url = localStorage.getItem('url') || environment.url;
  vending_server = localStorage.getItem('vending_server') || environment.vending_server;
  machineId = localStorage.getItem('machineId') || '12345678';
  otp = localStorage.getItem('otp') || '111111';

  portName = localStorage.getItem('portName') || '/dev/ttyS1';
  baudRate = localStorage.getItem('baudRate') || '57600';
  device = localStorage.getItem('device') || 'VMC';

  contact = localStorage.getItem('contact') || '55516321';
  isRobotMuted = localStorage.getItem('isRobotMuted') ? true : false;
  isMusicMuted = localStorage.getItem('isMusicMuted') ? true : false;
  isAds = localStorage.getItem('isAds') ? true : false;
  francisemode = localStorage.getItem('francisemode') ? true : false;
  musicVolume = localStorage.getItem('musicVolume') ? Number(localStorage.getItem('musicVolume')) : 6;
  productFallLimit = localStorage.getItem('product_fall_limit') ? Number(localStorage.getItem('product_fall_limit')) : 10;

  dropSensor = localStorage.getItem('dropSensor') ? Number(localStorage.getItem('dropSensor')) : 1;

  offlineMode = localStorage.getItem('offlineMode') ? true : false;

  startM: number = 1;
  endM = 60;
  testIn: any;
  testInTitle: string = 'test motor';

  successList: Array<number> = [];
  errorList: Array<number> = [];

  devices = ['VMC', 'ZDM8', 'Tp77p', 'essp', 'cctalk', 'm102', 'adh815'];

  constructor(
    public apiService: ApiService,
    public storage: IonicStorageService,
    private cashingService: AppcachingserviceService,
    public modal: ModalController,
  ) { }

  ngOnInit() {
  }
  ngOnDestroy(): void {
    if (this.testIn) {
      clearInterval(this.testIn);
    }
  }
  pinFormatter(value: number) {
    return `${value}%`;
  }
  save() {
    localStorage.setItem('wsurl', this.wsurl)
    localStorage.setItem('url', this.url)
    localStorage.setItem('vending_server', this.vending_server)
    localStorage.setItem('machineId', this.machineId)
    localStorage.setItem('otp', this.otp)
    localStorage.setItem('contact', this.contact)
    localStorage.setItem('isRobotMuted', this.isRobotMuted ? 'yes' : '');
    localStorage.setItem('isMusicMuted', this.isMusicMuted ? 'yes' : '');
    localStorage.setItem('isAds', this.isAds ? 'yes' : '');
    localStorage.setItem('francisemode', this.francisemode ? 'yes' : '');
    localStorage.setItem('musicVolume', this.musicVolume + '');

    localStorage.setItem('portName', this.portName);
    localStorage.setItem('baudRate', this.baudRate);
    localStorage.setItem('device', this.device);

    localStorage.setItem('offlineMode', this.offlineMode + '');
    localStorage.setItem('dropSensor', this.dropSensor + '');

    // product fall limit
    if (this.productFallLimit > 30) this.productFallLimit = 30;
    else if (this.productFallLimit < 0) this.productFallLimit = 10;
    localStorage.setItem('product_fall_limit', this.productFallLimit + '');


    this.storage.set('saleStock', [], 'stock').then(r => {
      console.log('reset', r);
      // window.location.reload();
      this.apiService.reloadPage();
    }).catch(e => {
      console.log('reset error', e);
    });
  }



  getToTestMotorPage(i: string) {
    let data = {
      action: i
    }
    console.log(TestmotorPage, data);

    this.apiService.showModal(TestmotorPage, data, true, 'dialog-fullscreen').then(r => {
      r.present();
      r.onDidDismiss().then(res => {
        if (res.data.reload) {
        }
      })
    })
  }

  selectDevice(event) {
    localStorage.setItem('device', this.device);
  }
  reset() {
    this.storage.set('saleStock', [], 'stock').then(r => {
      console.log('reset', r);
      // window.location.reload();
      this.apiService.reloadPage();
    }).catch(e => {
      console.log('reset error', e);
    });
  }

  openSettingControlMenu() {
    this.apiService.modal.create({ component: SettingControlMenuPage, cssClass: 'dialog-fullscreen' }).then(r => {
      r.present();
    });
  }

  testMotor(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      let start = this.startM;
      let end = this.endM;
      try {

        this.successList = [];
        this.errorList = [];

        if (!(this.startM && this.endM)) throw new Error(IENMessage.parametersEmpty);
        if (this.startM > this.endM) throw new Error(IENMessage.startShouldLesterThenEnd);
        if (this.endM < this.startM) throw new Error(IENMessage.endShouldMoreThenStart);

        if (this.testIn) {
          this.testInTitle = 'test motor';
          clearInterval(this.testIn);
          this.testIn = null;
          return resolve(IENMessage.success);

        }

        this.testInTitle = 'stop test motor';
        this.testIn = setInterval(() => {


          if (start <= end) {

            const params = {
              command: 'test',
              data: {
                slot: start
              }
            }
            axios.post(`http://localhost:19006`, params)
              .then(r => {
                console.log(`response`);
                this.successList.push(start);
                this.apiService.simpleMessage(`SUCCESS: test motor ${start}`, 1000);
              })
              .catch(error => {
                this.errorList.push(start);
                this.apiService.simpleMessage(`ERROR: test motor ${start}`, 1000);
              });
            start += 1;

          }
          else {
            this.apiService.simpleMessage(`SUCCESS ${this.successList.length || 0} ERROR ${this.errorList.length || 0}`, 1000);
            clearInterval(this.testIn);
            this.testIn = null;
            start = this.startM;
            end = this.endM;
            this.testInTitle = 'test motor';
            resolve(IENMessage.success);
          }

        }, 3000);


      } catch (error) {
        this.apiService.simpleMessage(error.message);
        if (this.testIn != null) clearInterval(this.testIn);
        this.testIn = null;
        start = this.startM;
        end = this.endM;
        this.testInTitle = 'test motor';
        resolve(error.message);
      }
    })
  }

  // testMotor() {
  //   if (!(this.startM && this.endM))

  //   if (!this.testIn) {
  //     setInterval(() => {
  //       if (this.startM <= this.endM) {
  //         const params = {
  //           command: 'test',
  //           data: {
  //             slot: this.startM
  //           }
  //         }
  //         axios.post('', params)
  //         .then(r => this.apiService.simpleMessage(`test motor ${this.startM} success`, 1000))
  //         .catch(error => this.apiService.simpleMessage(`test motor ${this.startM} fail`, 1000))
  //         this.startM+=1;

  //       } else {
  //         this.apiService.simpleMessage(IENMessage.testMotorSuccess, 1000);
  //         clearInterval(this.testIn);
  //         this.testIn = null;
  //         this.startM = 1;
  //       }
  //     }, 5000)
  //   } else {
  //     this.apiService.simpleMessage(IENMessage.testMotorSuccess, 1000);
  //     clearInterval(this.testIn);
  //     this.testIn = null;
  //   }
  // }

  testSlot() {
    const params = {
      command: 'test',
      data: {
        slot: 1
      }
    }
    axios.post(`http://localhost:19006`, params)
      .then(r => {
        console.log(`response`);
        this.apiService.simpleMessage(`SUCCESS: test motor ${1}`, 5000);
      })
      .catch(error => {
        this.apiService.simpleMessage(`ERROR: test motor ${1}`, 5000);
      });
  }

  resetCashing(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const ownerUuid = localStorage.getItem('machineId');
        if (ownerUuid) {
          await this.cashingService.remove(ownerUuid);
          // window.location.reload();
          this.apiService.reloadPage();
        }

        resolve(IENMessage.success);
      } catch (error) {
        this.apiService.alertError(error.message);
        resolve(error.message);
      }
    });
  }

}
