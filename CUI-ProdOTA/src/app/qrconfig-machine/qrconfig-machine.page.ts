import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from '../services/api.service';

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
        this.stopLoadConfigMachineLoop();
        await this.modalCtrl.dismiss();
      }
      // console.log('-----> loadConfigMachine :', resStatus);
    } catch (error) {

    } finally {
      this.isLoadingConfigMachine = false;
    }
  }

}
