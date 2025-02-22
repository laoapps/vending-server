// import { ChangeDetectorRef, Injectable } from '@angular/core';
// import { ToastController } from '@ionic/angular';
// import { LoadingController } from '@ionic/angular/providers/loading-controller';
// import { Clipboard } from '@capacitor/clipboard';
// // import  {Serial, SerialOriginal}  from '@ionic-native/serial/ngx';
// import { UsbSerial, UsbSerialOptions, UsbSerialResponse } from "usb-serial-plugin";
// import {IDevice} from './service';
// @Injectable({
//   providedIn: 'root'
// })
// export class VendingZDM8Service {
//   devices: Array<IDevice>;
//   usbserialResponse: UsbSerialResponse;
//   readData: string = "";
//   readError: object;
//   sendCmnd: string = "";
//   constructor(
//     private loadingController: LoadingController,
//     private changeRef: ChangeDetectorRef,
//     private toastSvc: ToastController
//   ) {
//     UsbSerial.usbAttachedDetached((response: UsbSerialResponse) => {
//       if (response.success && response.data) {
//         if (!this.usbserialResponse) {
//           if (response.data == 'NEW_USB_DEVICE_ATTACHED') {
//             this.toastSvc.create({message:"New Usb device Attached",duration:1000});
//             this.loadUsbDevices();
//           } else if (response.data == 'USB_DEVICE_DETACHED') {
//             this.toastSvc.create({message:"Usb device detached", duration:1000});
//             this.loadUsbDevices();
//           } else if (response.data == 'REGISTERED') {
//             this.toastSvc.create({message:"Usb Attach/Detach listener registered", duration:1000});
//           }
//         }
//       }
//     })
//     this.loadUsbDevices();
//   }

//   private async loadUsbDevices() {
//     this.usbserialResponse = undefined;
//     delete this.devices;
//     const loading = await this.loadingController.create({
//       message: 'Loading Devices...',
//       duration: 1000
//     });
//     await loading.present();
//     const result = await UsbSerial.connectedDevices();
//     if (result.success) {
//       console.log("Plugin Result Data", result.data);
//       this.devices = (<any> result.data).devices;
//     }
//     console.log("Plugin Result", result);
//   }

//   async retry() {
//     delete this.devices;
//     delete this.usbserialResponse;
//     this.loadUsbDevices();
//   }

//   async copyToClip() {
//     await Clipboard.write({
//       string: this.readData
//     });
//     this.toastSvc.create({message:"Copied to Clipboard", duration:1000});
//   }

//   async onDeviceSelected(item: IDevice) {
//     const loading = await this.loadingController.create({
//       message: 'Please wait...',
//       duration: 3000
//     });
//     this.toastSvc.create({message:'device id:: '+item.device.deviceId, duration:1000});
//     await loading.present();
//     const usbSerialOptions: UsbSerialOptions = { deviceId: item.device.deviceId, portNum: item.port, baudRate: 9600 }
//     this.usbserialResponse = await UsbSerial.openSerial(usbSerialOptions);
//     console.log(this.usbserialResponse);
//     this.toastSvc.create({message:"device response" + this.usbserialResponse.success,duration:1000});
//     if (this.usbserialResponse.success) {
//       this.toastSvc.create({message:"device response" + this.usbserialResponse.data,duration:1000});
//       UsbSerial.registerReadCall((response: UsbSerialResponse) => {
//         this.usbserialResponse = response;
//          if (response.success && response.data) {
//             this.readData += response.data;
//             this.toastSvc.create({message:response.data, duration:500});
//          } else {
//             this.readError = response.error;
//             this.toastSvc.create({message:response.error.toString(), duration:1000});
//          }
//          this.changeRef.detectChanges();
//       });
//     } else {
//       this.toastSvc.create({message:"device response" + this.usbserialResponse.error,duration:5000});
//     }
//   }

//   async sendCmnds() {
//     if (this.sendCmnd.length > 0) {
//       const result = await UsbSerial.writeSerial({data: this.sendCmnd});
//       if (result.success && result.data) {
//         this.toastSvc.create({message:"Write Serial Success: "+ result.data, duration:1000});
//       } else {
//         this.toastSvc.create({message:"Write Serial Fail: "+ result.error.message, duration:1000});
//       }
//     } else {
//       this.toastSvc.create({message:"Can't send empty string to device", duration:1000});
//     }
//   }

//   async closeSerial() {
//     await UsbSerial.closeSerial();
//     this.loadUsbDevices();
//   }
// }
