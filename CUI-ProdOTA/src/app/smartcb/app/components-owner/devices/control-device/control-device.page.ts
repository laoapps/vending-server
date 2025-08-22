import { Component, Input, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { LoadingService } from '../../../services/loading.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-control-device',
  templateUrl: './control-device.page.html',
  styleUrls: ['./control-device.page.scss'],
  standalone: false,
})
export class ControlDevicePage implements OnInit {
  @Input() data: any;
  controlDevice = { id: -1, command: 'TOGGLE', relay: 1 }; // New state for device control

  constructor(
    public m: LoadingService,
    private apiService: ApiService,
    public alertController: AlertController
  ) {}

  ngOnInit() {
    console.log('====================================');
    console.log(this.data);
    console.log('====================================');
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  async controlDeviceAction() {
    console.log('sksksksksk', this.controlDevice.id);

    if (!this.controlDevice.id || !this.controlDevice.relay) {
      this.m.onAlert('Please fill in all fields with valid values.')
      return;
    }
    this.m.onLoading('')
    if (this.controlDevice.id) {
      this.apiService
        .controlDevice(
          this.data,
          this.controlDevice.command,
          Number(this.controlDevice.relay)
        )
        .subscribe(
          async (response) => {
            console.log(
              `Controlled device ${this.controlDevice.id} with command ${this.controlDevice.command} on relay ${this.controlDevice.relay}`,
              response
            );
            this.m.onDismiss();
            this.m.alert_justOK('Control command sent successfully.');
            return;
          },
          (error) => {
            console.error(
              `Failed to control device ${this.controlDevice.id}:`,
              error
            );
            this.m.alertError('Failed to control device')
            this.m.onDismiss();
          }
        );
    }
  }
}
