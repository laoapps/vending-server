import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { ApiService } from '../services/api.service';
import { IonicStorageService } from '../services/ionic-storage.service';
import { AppcachingserviceService } from '../services/appcachingservice.service';
import { ModalController } from '@ionic/angular';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-setting-config',
  templateUrl: './setting-config.page.html',
  styleUrls: ['./setting-config.page.scss'],
})
export class SettingConfigPage implements OnInit {

  deviecId: string = '';
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
  isLTC = localStorage.getItem('isLTC') ? true : false;
  isHMVending = localStorage.getItem('isHMVending') ? true : false;
  francisemode = localStorage.getItem('francisemode') ? true : false;
  qrMode = localStorage.getItem('qrMode') ? true : false;
  musicVolume = localStorage.getItem('musicVolume') ? Number(localStorage.getItem('musicVolume')) : 6;
  productFallLimit = localStorage.getItem('product_fall_limit') ? Number(localStorage.getItem('product_fall_limit')) : 10;

  dropSensor = localStorage.getItem('dropSensor') ? Number(localStorage.getItem('dropSensor')) : 1;

  offlineMode = localStorage.getItem('offlineMode') ? true : false;
  NV9USB = localStorage.getItem('NV9USB') ? (localStorage.getItem('NV9USB') === 'true' ? true : false) : false;

  startM: number = 1;
  endM = 60;
  testIn: any;
  testInTitle: string = 'test motor';

  successList: Array<number> = [];
  errorList: Array<number> = [];

  devices = ['VMC', 'ZDM8', 'Tp77p', 'essp', 'cctalk', 'm102', 'adh815', 'adh814'];

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

  selectDevice(event: Event) {
    this.device = (event as CustomEvent).detail.value;
  }

  exit() {
    App.exitApp();
  }

  resetCashing() {
    this.apiService.resetCashing({ machineId: this.machineId }).subscribe({
      next: () => this.apiService.simpleMessage('reset cashing success'),
      error: error => this.apiService.simpleMessage(error?.message || 'reset cashing error')
    });
  }

  openSettingControlMenu() {
    const tab = (this.apiService as any).myTab1;
    if (tab?.openSettingControlMenu) {
      tab.openSettingControlMenu();
      return;
    }

    this.apiService.simpleMessage('Control menu is unavailable');
  }

  testMotor() {
    const tab = (this.apiService as any).myTab1;
    if (tab?.testMotor) {
      tab.testMotor(this.startM, this.endM);
      return;
    }

    this.apiService.simpleMessage('Motor test is unavailable');
  }

  enableCashin() {
    const tab = (this.apiService as any).myTab1;
    if (tab?.Enable) {
      tab.Enable();
      return;
    }

    this.apiService.simpleMessage('Cashin control is unavailable');
  }

  disableCashin() {
    const tab = (this.apiService as any).myTab1;
    if (tab?.Disable) {
      tab.Disable();
      return;
    }

    this.apiService.simpleMessage('Cashin control is unavailable');
  }


  changeURL() {

    localStorage.setItem('isLTC', this.isLTC ? 'yes' : '');

    this.wsurl = this.isLTC ? environment.wsLTC : environment.wsHM;
    console.log('----->', this.wsurl);

    this.url = this.isLTC ? environment.urlLTC : environment.urlHM;
    console.log('----->', this.url);

    this.vending_server = this.isLTC ? environment.vendingLTC : environment.vendingHM;
    console.log('----->', this.vending_server);

  }

  async save() {
    const configData: any = {};
    // localStorage.setItem('isLTC', this.isLTC ? 'yes' : '');
    configData.deviecId = this.deviecId;
    configData.isLTC = this.isLTC ? 'yes' : '';

    // localStorage.setItem('wsurl', this.wsurl)
    configData.wsurl = this.wsurl;
    // localStorage.setItem('url', this.url)
    configData.url = this.url;
    // localStorage.setItem('vending_server', this.vending_server)
    configData.vending_server = this.vending_server;
    // localStorage.setItem('machineId', this.machineId)
    configData.machineId = this.machineId;
    // localStorage.setItem('otp', this.otp)
    configData.otp = this.otp;
    // localStorage.setItem('contact', this.contact)
    configData.contact = this.contact;
    // localStorage.setItem('isRobotMuted', this.isRobotMuted ? 'yes' : '');
    configData.isRobotMuted = this.isRobotMuted ? 'yes' : '';
    // localStorage.setItem('isMusicMuted', this.isMusicMuted ? 'yes' : '');
    configData.isMusicMuted = this.isMusicMuted ? 'yes' : '';
    // localStorage.setItem('isAds', this.isAds ? 'yes' : '');
    configData.isAds = this.isAds ? 'yes' : '';
    // localStorage.setItem('francisemode', this.francisemode ? 'yes' : '');
    configData.francisemode = this.francisemode ? 'yes' : '';
    // localStorage.setItem('qrMode', this.qrMode ? 'yes' : '');
    configData.qrMode = this.qrMode ? 'yes' : '';
    // localStorage.setItem('musicVolume', this.musicVolume + '');
    configData.musicVolume = this.musicVolume + '';

    // localStorage.setItem('portName', this.portName);
    configData.portName = this.portName;
    // localStorage.setItem('baudRate', this.baudRate);
    configData.baudRate = this.baudRate;
    // localStorage.setItem('device', this.device);
    configData.device = this.device;

    // localStorage.setItem('offlineMode', this.offlineMode + '');
    configData.offlineMode = this.offlineMode + '';
    // localStorage.setItem('dropSensor', this.dropSensor + '');
    configData.dropSensor = this.dropSensor + '';
    // localStorage.setItem('NV9USB', this.NV9USB ? 'true' : 'false');
    configData.NV9USB = this.NV9USB ? 'true' : 'false';


    // product fall limit
    if (this.productFallLimit > 30) this.productFallLimit = 30;
    else if (this.productFallLimit < 0) this.productFallLimit = 10;
    // localStorage.setItem('product_fall_limit', this.productFallLimit + '');
    configData.product_fall_limit = this.productFallLimit + '';

    // console.log('-----> configData :', configData);

    const response = await this.apiService.setConfigMachine(configData).toPromise();
    console.log('-----> RESPONSE :', response['data']);





    // this.storage.set('saleStock', [], 'stock').then(r => {
    //   console.log('reset', r);
    // }).catch(e => {
    //   console.log('reset error', e);
    // });
  }

}
