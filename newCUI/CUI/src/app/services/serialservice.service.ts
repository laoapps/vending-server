import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { serialconnectioncapacitor } from 'serialconnectioncapacitor';


@Injectable({
  providedIn: 'root'
})
export class SerialserviceService {

  constructor(public toast: ToastController) {

  }


  async useSerialPort() {
    try {
      if (!serialconnectioncapacitor) {
        console.error('"serialconnectioncapacitor" plugin is not implemented on this platform');
        this.toast.create({ message: 'serialconnectioncapacitor plugin is not implemented on this platform', duration: 2000 }).then(r => {
          r.present();
        });
        return;
      }
      console.log('Serial service is ready', serialconnectioncapacitor);


      serialconnectioncapacitor.listPorts().then((ports) => {
        console.log('Available ports:', ports);
        this.toast.create({ message: `Available ports: ${JSON.stringify(ports)}`, duration: 2000 }).then(r => {
          r.present();
        });
      }).catch((error) => {
        console.error('Error listPorts:', error);
        this.toast.create({ message: `Error listPorts :${error}`, duration: 2000 }).then(r => {
          r.present();
        });
      });
      // console.log('Available ports:', ports);
      // this.toast.create({ message: `Available ports: ${JSON.stringify(ports)}`, duration: 2000 }).then(r => {
      //   r.present();
      // });
      // const firstPort = Object.keys(ports.ports)[0];

      // await serialconnectioncapacitor.open({ portPath: '/dev/ttyS1', baudRate: 115200 });
      // console.log('Port opened');

      // console.log(`Opened port: ${firstPort}`);
      // List available ports


      // if (!ports.ports || Object.keys(ports.ports).length === 0) {
      //   console.error('No serial ports available');
      //   this.toast.create({ message: 'No serial ports available', duration: 2000 }).then(r => {
      //     r.present();
      //   });
      //   return;
      // }



      // serialconnectioncapacitor.addEvent('dataReceived', (data) => {
      //   console.log('Data:', data);
      //   this.toast.create({ message: `Data Received: ${data}`, duration: 2000 }).then(r => {
      //     r.present();
      //   });
      // });
    } catch (error) {
      console.log('Error useSerialPort:', error);
      this.toast.create({ message: `Error useSerialPort :${error}`, duration: 2000 }).then(r => {
        r.present
      });

    }

  }

}
