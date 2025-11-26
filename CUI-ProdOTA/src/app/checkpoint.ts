import { Injectable } from '@angular/core';
import cryptojs, { mode } from 'crypto-js';
import { environment } from 'src/environments/environment';
import qrlogo from 'qrcode-with-logos';

@Injectable({
  providedIn: 'root'
})
export class Checkpoint {
  url = localStorage.getItem('url') || environment.url;
  constructor() { }
  private getCheckpointKey(): string {
    const machineId = localStorage.getItem('machineId');
    const otp = localStorage.getItem('otp');
    const token = cryptojs.SHA256(machineId + otp).toString(cryptojs.enc.Hex);
    return token;
  }
  public async createQRCheckpoint() {
    return new Promise<string>(async (resolve, reject) => {
      try {
        const key = {
          type: 'checkpoint',
          url: this.getCheckpointKey()
        }
        const qr = await new qrlogo({ content: JSON.stringify(key) }).getCanvas();
        resolve(qr.toDataURL());
      } catch (error) {
        reject(error);
      }
    });
  }



}
