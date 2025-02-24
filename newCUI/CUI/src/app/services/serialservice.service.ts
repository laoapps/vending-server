import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { SerialConnectionCapacitor } from 'SerialConnectionCapacitor';
import { Serial, SerialDriverEnum, SerialError } from '@adeunis/capacitor-serial';

@Injectable({
  providedIn: 'root'
})
export class SerialserviceService {

  constructor(public toast: ToastController) {

  }
  bytesToHexString(bytes: number[]): string {
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  async useSerialPort() {
    try {

      SerialConnectionCapacitor.addListener('nativeSerialOpened', (data) => {
        console.log('Connection opened:', data);
      });
      SerialConnectionCapacitor.addListener('usbSerialOpened', (data) => {
        console.log('Connection opened:', data);
      });
      SerialConnectionCapacitor.addListener('connectionClosed', (data) => {
        console.log('Connection closed:', data);
      });
      SerialConnectionCapacitor.addListener('connectionError', (data) => {
        console.error('connectionError received:', data);
      });
      SerialConnectionCapacitor.addListener('dataReceived', (data) => {
        console.error('connectionError received:', data);
      });
      SerialConnectionCapacitor.addListener('listError', (data) => {
        console.error('listError received:', data);
      });
      SerialConnectionCapacitor.addListener('portsListed', (data) => {
        console.error('portsListed received:', data);
      });
      SerialConnectionCapacitor.addListener('readError', (data) => {
        console.error('readError received:', data);
      });
      SerialConnectionCapacitor.addListener('readingStarted', (data) => {
        console.error('readingStarted received:', data);
      });
      SerialConnectionCapacitor.addListener('readingStopped', (data) => {
        console.error('readingStopped received:', data);
      });
      SerialConnectionCapacitor.addListener('writeError', (data) => {
        console.error('writeError received:', data);
      });
      SerialConnectionCapacitor.addListener('usbWriteSuccess', (data) => {
        console.error('writeError received:', data);
      });
      SerialConnectionCapacitor.addListener('nativeWriteSuccess', (data) => {
        console.error('nativeWriteSuccess received:', data);
      });
      SerialConnectionCapacitor.addListener('portsListed', (data) => {
        console.error('nativeWriteSuccess received:', data);
      });
      SerialConnectionCapacitor.listPorts().then(async (result) => {
        console.log("Available ports:", result.ports);
        const ports = Object.keys(result.ports);

        for (const port of ports) {
          if (port.startsWith("/dev/ttyS")) {
            try {
              if(port !== "/dev/ttyS0") {
                continue
              }
              await SerialConnectionCapacitor.openNativeSerial({ portName: port, baudRate: 57600 });
              console.log(`Opened ${port}`);
               await SerialConnectionCapacitor.startReading();
               console.log(`Started reading ${port}`);
              const pollCommand = this.bytesToHexString([0xFA, 0xFB, 0x41, 0x00, 0x40]);
              await SerialConnectionCapacitor.write({ data: pollCommand });
              console.log(`Wrote to ${port}`);
             
              
              // // Wait a bit or listen for data
              // await new Promise(resolve => setTimeout(resolve, 2000));
              // await SerialConnectionCapacitor.close();
              // console.log(`Closed ${port}`);
            } catch (err) {
              console.error(`Failed ${port}:`, err);
            }
          }
        }

      }).catch((err) => {
        console.error('Failed to list ports:', err);
      }
      );

    } catch (error) {
      console.error('Failed to list ports:', error);
    }
    // async useSerialPort() {
    //   //Connection
    //   Serial.requestSerialPermissions({vendorId: '1111', productId: '2222', driver: SerialDriverEnum.FTDI_SERIAL_DRIVER})
    //   .then((permissionResponse) => {
    //       if (!permissionResponse.granted) {
    //           return Promise.reject('Permission refused');
    //       }
    //       return Promise.resolve();

    //   })
    //   .then(() => Serial.openConnection({baudRate: 57600}))
    //   .then(() => console.info('Serial connection opend'))
    //   .catch((error) => console.error(error));

    //   //Write
    //   const pollCommand = this.bytesToHexString([0xFA, 0xFB, 0x41, 0x00, 0x40]);
    //   Serial.write({data: pollCommand})
    //       .then(() => console.info('Data sent'))
    //       .catch((error: SerialError ) => {
    //         console.error(`error : ${error}`);
    //       });


    //   //Read
    //   Serial.read({readRaw: false}).then((message) => console.info(message.data));
    //   Serial.registerReadRawCallback((message, error) => {
    //       console.info(`message : ${message}`,error);
    //     });
    //   //Read callback 
    //   Serial.registerReadCallback((message, error) => {
    //       if (message !== undefined && message !== null) {
    //         console.info(message.data);

    //       } else if (error !== undefined && error !== null) {
    //         console.error(`error : ${error}`);
    //       }
    //   })
  }
  //   Serial.closeConnection().then(() => console.info('Serial connection closed'));
  // }

}
