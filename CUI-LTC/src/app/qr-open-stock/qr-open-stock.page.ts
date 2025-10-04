import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import QRCodeWithLogo from 'qrcode-with-logos';
import { ApiService } from '../services/api.service';
import * as cryptojs from 'crypto-js';



@Component({
  selector: 'app-qr-open-stock',
  templateUrl: './qr-open-stock.page.html',
  styleUrls: ['./qr-open-stock.page.scss'],
})
export class QrOpenStockPage implements OnInit {

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;


  qrData: any;
  qrString: string = '';
  logoUrl: string = 'assets/icon/logo.png';

  constructor(
    public apiService: ApiService,
  ) { }

  ngOnInit() {
    const token = cryptojs
      .SHA256(this.apiService.machineId.machineId + this.apiService.machineId.otp)
      .toString(cryptojs.enc.Hex)
    this.qrData = {
      secret: this.apiService.secret,
      token: token
    };

    this.qrString = JSON.stringify(this.qrData);

    // สร้าง QR เมื่อโหลดหน้าเสร็จ
    setTimeout(() => {
      this.generateQRCode();
    }, 200);
  }

  async generateQRCode() {
    const canvas = this.canvas.nativeElement;

    new QRCodeWithLogo({
      canvas,
      content: this.qrString,
      width: 700, // ขยายจาก 260 → 400
      logo: {
        src: this.logoUrl,
        logoRadius: 10,
        // borderSize: 4,
      },
      nodeQrCodeOptions: {
        errorCorrectionLevel: 'H',
        margin: 1,
      },
    }).toCanvas();
  }

}
