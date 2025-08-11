import { Component, Input, OnInit } from '@angular/core';
import QrCodeWithLogo from 'qrcode-with-logos';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-pay-qr',
  templateUrl: './pay-qr.page.html',
  styleUrls: ['./pay-qr.page.scss'],
  standalone: false,

})
export class PayQrPage implements OnInit {
  public qrcode_logo:any
  private intervalId: any;
  private totalSeconds = 5 * 60; // 1 minutes
  private totalSeconds_expired = 5 * 60; // 1 minutes
  currentColor: string = 'color-red';
  private colorInterval: any;
  countdown: string = '';
  public pic_device = '../../../assets/icon/laoqr.png'
  @Input() data:any
  @Input() data_device:any
  @Input() data_pageket:any



  constructor(public apiService: ApiService, public m: LoadingService) {}

  ngOnInit() {
    this.genQrcode();
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  genQrcode(){
    // this.load.onLoading('')
      let qrcode = new QrCodeWithLogo({
        content: this.data.emv,
        width: 250,
        logo: {
          src: this.pic_device,
          logoRadius: 10, // Optional: adjust for rounded corners
          borderRadius: 5, // Optional: adjust for border
          borderColor: "#ff00000", // Optional: white border
          borderWidth: 3, // Optional: border width
          bgColor: "#ffffff", // Optional: background color
          crossOrigin: "Anonymous", // Optional: for CORS
        }
      });
      qrcode.getCanvas().then(canvas => {
        // this.load.onDismiss()
        this.qrcode_logo = canvas.toDataURL()
        // or do other things with image
      }).catch(e => {
        console.log(e);
      })
  }

  startCountdown() {
    this.updateDisplay();
    this.intervalId = setInterval(() => {
      this.totalSeconds--;
      this.updateDisplay();

      if (this.totalSeconds <= 0) {
        clearInterval(this.intervalId);
        clearInterval(this.colorInterval);
        this.countdown = 'ໝົດເວລາ!';
      }
    }, 1000);
  }

  startColorChange() {
    const colors = ['color-black','color-red'];
    let index = 0;

    this.colorInterval = setInterval(() => {
      this.currentColor = colors[index];
      index = (index + 1) % colors.length;
    }, 1000);
  }

  updateDisplay() {
    const minutes = Math.floor(this.totalSeconds / 60);
    const seconds = this.totalSeconds % 60;
    this.countdown = `${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  pad(val: number): string {
    return val < 10 ? '0' + val : val.toString();
  }

}
