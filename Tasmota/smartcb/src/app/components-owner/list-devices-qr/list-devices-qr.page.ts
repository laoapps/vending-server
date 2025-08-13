import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';
import { MqttClientService } from 'src/app/services/mqttClient.service';
import { AddDevicesPage } from '../devices/add-devices/add-devices.page';
import { ControlDevicePage } from '../devices/control-device/control-device.page';
import { GenQrCodePage } from '../gen-qr-code/gen-qr-code.page';

@Component({
  selector: 'app-list-devices-qr',
  templateUrl: './list-devices-qr.page.html',
  styleUrls: ['./list-devices-qr.page.scss'],
  standalone: false,
})
export class ListDevicesQrPage implements OnInit {
  devices: any[] = [];
  controlDevice = { id: -1, command: 'TOGGLE', relay: 1 }; // New state for device control

  constructor(
    public m: LoadingService,
    public apiService: ApiService,
    private mqttService: MqttClientService,
    public alertController: AlertController
  ) {}

  ngOnInit() {
    this.load_data();
  }

  load_data() {
    this.m.onLoading('');
    this.apiService.getDevices().subscribe(
      (devices) => {
        console.log('====================================');
        console.log(devices);
        console.log('====================================');
        this.m.onDismiss();
        this.devices = devices;
        this.devices.forEach((device) => {
          this.mqttService
            .subscribeToDevice(device.tasmotaId)
            .subscribe((message) => {
              try {
                device.status = JSON.parse(message.payload.toString());
              } catch (error) {
                this.m.onDismiss();
                // this.m.onAlert('Failed to parse message for device!!');
                device.status = message.payload.toString();
              }
            });
          this.mqttService
            .subscribeToTelemetry(device.tasmotaId)
            .subscribe((message) => {
              console.log(
                `Received telemetry for device ${device.tasmotaId}:`,
                message
              );
              try {
                const data = JSON.parse(message.payload.toString());
                console.log(
                  `Parsed telemetry data for device ${device.tasmotaId}:`,
                  data
                );
                device.power = data?.ENERGY?.Power || 0;
                device.energy = data?.ENERGY?.Total || 0;
                device.Temperature =
                  (data?.ANALOG?.Temperature1 || 0) + ' ' + data?.TempUnit;
              } catch (error) {
                this.m.onDismiss();
                // this.m.onAlert('Failed to parse telemetry data!!');
                device.status = message.payload.toString();
              }
            });
        });
      },
      (error) => {}
    );
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  onClick_to_qr(item) {
    this.m
      .showModal(GenQrCodePage, { data: item, ownerId: item.ownerId })
      .then((r) => {
        if (r) {
          r.present();
          r.onDidDismiss().then((res) => {
            if (res.data.dismiss) {
              this.devices = [];
              this.load_data();
            }
          });
        }
      });
  }
}
