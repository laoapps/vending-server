import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-add-devices',
  templateUrl: './add-devices.page.html',
  styleUrls: ['./add-devices.page.scss'],
  standalone: false,
})
export class AddDevicesPage implements OnInit {
  newDevice = { name: '', tasmotaId: '', zone: '', groupId: -1 };
  groups: any[] = [];

  constructor(public m: LoadingService, private apiService: ApiService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.load_group();
  }

  load_group() {
    this.apiService.getGroups().subscribe((groups) => {
      this.groups = groups;
    });
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  async addDevice() {
    if (
      !this.newDevice.name ||
      !this.newDevice.tasmotaId ||
      !this.newDevice.zone ||
      !this.newDevice.groupId
    ) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Please fill in all fields with valid values.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    console.log('====================================');
    console.log(this.newDevice);
    console.log('====================================');
    this.apiService
      .createDevice(
        this.newDevice.name,
        this.newDevice.tasmotaId,
        this.newDevice.zone,
        this.newDevice.groupId
      )
      .subscribe(() => {
        this.newDevice = { name: '', tasmotaId: '', zone: '', groupId: -1 };
        this.m.closeModal({ dismiss: true });
      });
  }
}
