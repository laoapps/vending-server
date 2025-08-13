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
    this.m.onLoading('')
    this.apiService.getGroups().subscribe((groups) => {
      console.log('====================================');
      console.log('Groups loaded:', groups);
      console.log('====================================');
      this.groups = groups;
      this.m.onDismiss()
    },error=>{
      this.m.onDismiss();
      this.m.alertError('load Groups fail!!')
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
      this.m.onAlert('Please fill in all fields with valid values.')
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
        this.m.onDismiss();
        this.newDevice = { name: '', tasmotaId: '', zone: '', groupId: -1 };
        this.m.closeModal({ dismiss: true });
      }, (error) => {
        this.m.onDismiss();
        this.m.onAlert('Failed to create schedule package!!')
        console.error('Failed to create schedule package:', error);
      })
  }
}
