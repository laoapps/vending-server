import { Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import * as QRScan from 'qr-scanner';

@Component({
  selector: 'app-phone-secret-dialog',
  templateUrl: './phone-secret-dialog.component.html',
  styleUrls: ['./phone-secret-dialog.component.scss'],
})
export class PhoneSecretDialogComponent implements OnDestroy {
  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  phoneNumber = '';
  secret = '';
  errorMessage = '';
  scanning = false;
  hasSecretLocal = !!localStorage.getItem('secretLocal');

  private qrscanner?: QRScan.default;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private ngZone: NgZone,
  ) {}

  ngOnDestroy() {
    this.stopScanner();
  }

  async dismiss() {
    this.stopScanner();
    await this.modalCtrl.dismiss(null, 'cancel');
  }

  async confirm() {
    this.errorMessage = '';
    if (!this.phoneNumber?.trim()) {
      this.errorMessage = 'กรุณากรอกเบอร์โทรศัพท์';
      return;
    }
    if (!this.hasSecretLocal && !this.secret?.trim()) {
      this.errorMessage = 'กรุณากรอกให้ครบทุกช่อง';
      return;
    }

    this.stopScanner();
    await this.modalCtrl.dismiss(
      {
        phoneNumber: this.phoneNumber.trim(),
        secret: this.secret?.trim() || localStorage.getItem('secretLocal') || '',
      },
      'confirm'
    );
  }

  async toggleScan() {
    if (this.scanning) {
      this.stopScanner();
      this.scanning = false;
      return;
    }
    this.scanning = true;
    this.errorMessage = '';
    // Wait for *ngIf video to render
    setTimeout(() => this.startScanner(), 100);
  }

  private async startScanner() {
    const video = this.videoEl?.nativeElement;
    if (!video) {
      this.errorMessage = 'ไม่พบกล้อง';
      this.scanning = false;
      return;
    }

    try {
      this.qrscanner = new QRScan.default(video, (result) => {
        const raw = typeof result === 'string' ? result : (result as any)?.data;
        this.ngZone.run(() => this.onScanResult(raw));
      });
      await this.qrscanner.start();
    } catch (err) {
      console.error(err);
      this.errorMessage = 'ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้งานกล้อง';
      this.scanning = false;
    }
  }

  private stopScanner() {
    try {
      if (this.qrscanner) {
        this.qrscanner.stop();
        this.qrscanner.destroy();
        this.qrscanner = undefined;
      }
    } catch (_) {}
  }

  private async onScanResult(raw: string) {
    if (!raw) return;
    this.stopScanner();
    this.scanning = false;

    const parsed = this.parseQrPayload(raw);
    if (!parsed.secret && !parsed.phoneNumber) {
      this.errorMessage = 'QR ไม่ถูกต้อง';
      return;
    }

    if (parsed.phoneNumber) {
      this.phoneNumber = parsed.phoneNumber;
    }
    if (parsed.secret) {
      this.secret = parsed.secret;
    }

    const toast = await this.toastCtrl.create({
      message: 'สแกน QR สำเร็จ',
      duration: 1500,
      color: 'success',
      position: 'top',
    });
    await toast.present();
  }

  /** Supports plain secret text, or JSON with phone/secret fields. */
  private parseQrPayload(raw: string): { phoneNumber?: string; secret?: string } {
    const text = raw.trim();
    try {
      const data = JSON.parse(text);
      if (data && typeof data === 'object') {
        const phoneNumber =
          data.phoneNumber || data.phonenumber || data.phone || data.shopPhonenumber || '';
        const secret = data.secret || data.token || data.รหัสลับ || '';
        if (phoneNumber || secret) {
          return {
            phoneNumber: phoneNumber ? String(phoneNumber) : undefined,
            secret: secret ? String(secret) : undefined,
          };
        }
      }
    } catch (_) {
      // not JSON — treat as secret string
    }

    // phone:secret or phone|secret
    if (text.includes(':') || text.includes('|')) {
      const sep = text.includes('|') ? '|' : ':';
      const [a, b] = text.split(sep).map((s) => s.trim());
      if (a && b) {
        // Prefer first as phone if it looks numeric
        if (/^\+?\d[\d\s-]{6,}$/.test(a)) {
          return { phoneNumber: a.replace(/\s/g, ''), secret: b };
        }
        return { secret: text };
      }
    }

    return { secret: text };
  }

  onSelectImage(files: FileList | null) {
    if (!files?.length) return;
    QRScan.default.scanImage(files[0]).then(
      (rx) => this.ngZone.run(() => this.onScanResult(rx)),
      () => {
        this.errorMessage = 'ไม่พบ QR ในรูปภาพ';
      }
    );
  }
}
