import { Component, Input, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';

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
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Please fill in all fields with valid values.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

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
            const alert = await this.alertController.create({
              header: 'Alert',
              message: 'Control command sent successfully.',
              buttons: [{
                text: 'OK',
                handler: () => {
                  this.dismiss({ dismiss: true });
                },
              }],
            });
            await alert.present();
            return;
          },
          (error) => {
            console.error(
              `Failed to control device ${this.controlDevice.id}:`,
              error
            );
          }
        );
    }
  }
}
