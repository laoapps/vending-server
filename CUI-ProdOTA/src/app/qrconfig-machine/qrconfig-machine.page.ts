import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { IonicStorageService } from '../ionic-storage.service';

@Component({
  selector: 'app-qrconfig-machine',
  templateUrl: './qrconfig-machine.page.html',
  styleUrls: ['./qrconfig-machine.page.scss'],
})
export class QrconfigMachinePage implements OnInit, OnDestroy {
  deviceIdQr: string = '';
  private loadConfigInterval: ReturnType<typeof setInterval> | null = null;
  private isLoadingConfigMachine = false;

  constructor(
    public apiService: ApiService,
    private modalCtrl: ModalController,
    public storage: IonicStorageService,
  ) { }

  ngOnInit() {
    this.getDeviceId();
  }

  ngOnDestroy() {
    this.stopLoadConfigMachineLoop();
  }

  async getDeviceId() {
    try {
      this.deviceIdQr = await this.apiService.getAndroidDeviceId();
      this.startLoadConfigMachineLoop();
      // console.log('-----> deviceIdQr :', this.deviceIdQr);
    } catch (error) {

    }
  }

  startLoadConfigMachineLoop() {
    this.stopLoadConfigMachineLoop();
    this.loadConfigMachine();
    this.loadConfigInterval = setInterval(() => {
      this.loadConfigMachine();
    }, 10000);
  }

  stopLoadConfigMachineLoop() {
    if (this.loadConfigInterval) {
      clearInterval(this.loadConfigInterval);
      this.loadConfigInterval = null;
    }
  }

  async loadConfigMachine() {
    if (this.isLoadingConfigMachine) return;

    try {
      this.isLoadingConfigMachine = true;
      const response = await this.apiService.loadConfigMachine(this.deviceIdQr);
      const resStatus = response?.data?.status;
      if (resStatus === 1) {
        const configData = response?.data?.data ?? {};
        // console.log('-----> configData :', configData);
        this.saveLocalStorage(configData);

        this.stopLoadConfigMachineLoop();
        await this.modalCtrl.dismiss();
      }
      // console.log('-----> loadConfigMachine :', resStatus);
    } catch (error) {

    } finally {
      this.isLoadingConfigMachine = false;
    }
  }

  async saveLocalStorage(configData: any) {
    try {
      localStorage.setItem('isLTC', configData.isLTC ? 'yes' : '');


      localStorage.setItem('wsurl', configData.wsurl)
      localStorage.setItem('url', configData.url)
      localStorage.setItem('vending_server', configData.vending_server)
      localStorage.setItem('machineId', configData.machineId)
      localStorage.setItem('otp', configData.otp)
      localStorage.setItem('contact', configData.contact)
      localStorage.setItem('isRobotMuted', configData.isRobotMuted ? 'yes' : '');
      localStorage.setItem('isMusicMuted', configData.isMusicMuted ? 'yes' : '');
      localStorage.setItem('isAds', configData.isAds ? 'yes' : '');
      localStorage.setItem('francisemode', configData.francisemode ? 'yes' : '');
      localStorage.setItem('qrMode', configData.qrMode ? 'yes' : '');
      localStorage.setItem('musicVolume', configData.musicVolume + '');
      if (configData.checkoutUiVersion) {
        let v = String(configData.checkoutUiVersion).trim();
        if (v === 'kiosk') v = 'v3';
        if (v !== 'v2' && v !== 'v3') v = 'default';
        localStorage.setItem('checkoutUiVersion', v);
      }

      localStorage.setItem('portName', configData.portName);
      localStorage.setItem('baudRate', configData.baudRate);
      localStorage.setItem('device', configData.device);

      localStorage.setItem('offlineMode', configData.offlineMode + '');
      localStorage.setItem('dropSensor', configData.dropSensor + '');
      localStorage.setItem('NV9USB', configData.NV9USB ? 'true' : 'false');
      localStorage.setItem('product_fall_limit', '10');
      this.storage.set('saleStock', [], 'stock').then(r => {
        console.log('reset', r);
        // window.location.reload();
        this.apiService.reloadPage();
      }).catch(e => {
        console.log('reset error', e);
      });
    } catch (error) {

    }
  }

}
