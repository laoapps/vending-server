import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-admin-unregistered-devices',
  templateUrl: './admin-unregistered-devices.page.html',
  styleUrls: ['./admin-unregistered-devices.page.scss'],
  standalone: false
})
export class AdminUnregisteredDevicesPage implements OnInit {
  unregisteredDevices: any[] = [];

  constructor(private apiService: ApiService, private alertController: AlertController) {}

  ngOnInit() {
    this.loadUnregisteredDevices();
  }

  loadUnregisteredDevices() {
    this.apiService.getUnregisteredDevices().subscribe(
      (devices) => {
        this.unregisteredDevices = devices;
      },
      (error) => {
        console.error('Failed to load unregistered devices:', error);
      }
    );
  }

  async banDevice(id: number, tasmotaId: string) {
    const alert = await this.alertController.create({
      header: 'Confirm Ban',
      message: `Are you sure you want to ban device ${tasmotaId}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Ban',
          handler: () => {
            this.apiService.banUnregisteredDevice(id).subscribe(
              () => {
                this.loadUnregisteredDevices();
              },
              (error) => {
                console.error('Failed to ban device:', error);
              }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  async unbanDevice(id: number, tasmotaId: string) {
    const alert = await this.alertController.create({
      header: 'Confirm Unban',
      message: `Are you sure you want to unban device ${tasmotaId}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Unban',
          handler: () => {
            this.apiService.unbanUnregisteredDevice(id).subscribe(
              () => {
                this.loadUnregisteredDevices();
              },
              (error) => {
                console.error('Failed to unban device:', error);
              }
            );
          }
        }
      ]
    });
    await alert.present();
  }
}