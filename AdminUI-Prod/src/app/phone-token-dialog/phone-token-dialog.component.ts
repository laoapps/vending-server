import { Component, Input } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-phone-token-dialog',
  templateUrl: './phone-token-dialog.component.html',
  styleUrls: ['./phone-token-dialog.component.scss'],
})
export class PhoneTokenDialogComponent {
  @Input() defaultPhoneNumber = '';

  constructor(private alertController: AlertController) { }

  // ฟังก์ชันสำหรับเปิด Dialog รับข้อมูล
  async showPhoneTokenDialog() {
    const alert = await this.alertController.create({
      header: 'ป้อนข้อมูล',
      message: 'กรุณากรอกหมายเลขโทรศัพท์และ Token',
      inputs: [
        {
          name: 'phoneNumber',
          type: 'tel',
          placeholder: 'หมายเลขโทรศัพท์ (9-10 หลัก)',
          attributes: {
            maxlength: 10
          }
        },
        {
          name: 'token',
          type: 'text',
          placeholder: 'Token (30 ตัวอักษร)',
          attributes: {
            maxlength: 30
          }
        }
      ],
      buttons: [
        {
          text: 'ยกเลิก',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'ยืนยัน',
          handler: (data) => {
            // ตรวจสอบความถูกต้องของข้อมูล
            const validation = this.validateInputs(data.phoneNumber, data.token);

            if (!validation.isValid) {
              // แสดงข้อผิดพลาดและไม่ปิด dialog
              this.showErrorAlert(validation.errors);
              return false; // ไม่ปิด dialog
            }

            // ข้อมูลถูกต้อง - ดำเนินการต่อ
            this.handleValidData(data.phoneNumber, data.token);
            return true; // ปิด dialog
          }
        }
      ]
    });

    await alert.present();
  }

  // ฟังก์ชันตรวจสอบความถูกต้องของข้อมูล
  private validateInputs(phoneNumber: string, token: string): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];

    // ตรวจสอบหมายเลขโทรศัพท์
    if (!phoneNumber || phoneNumber.trim() === '') {
      errors.push('กรุณากรอกหมายเลขโทรศัพท์');
    } else if (!/^[0-9]{9,10}$/.test(phoneNumber)) {
      errors.push('หมายเลขโทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก');
    }

    // ตรวจสอบ token
    if (!token || token.trim() === '') {
      errors.push('กรุณากรอก Token');
    } else if (token.length !== 30) {
      errors.push('Token ต้องมีความยาว 30 ตัวอักษรเท่านั้น');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // แสดงข้อผิดพลาด
  private async showErrorAlert(errors: string[]) {
    const errorMessage = errors.join('<br>');

    const alert = await this.alertController.create({
      header: 'ข้อมูลไม่ถูกต้อง',
      message: errorMessage,
      buttons: [
        {
          text: 'ตกลง',
          handler: () => {
            // เปิด dialog หลักอีกครั้ง
            setTimeout(() => {
              this.showPhoneTokenDialog();
            }, 100);
          }
        }
      ]
    });

    await alert.present();
  }

  // จัดการข้อมูลที่ถูกต้อง
  private handleValidData(phoneNumber: string, token: string) {
    console.log('Phone Number:', phoneNumber);
    console.log('Token:', token);

    // ทำอะไรกับข้อมูลที่ได้รับ
    // เช่น ส่งไป API, เก็บใน storage, etc.

    // แสดงข้อความยืนยัน
    this.showSuccessAlert(phoneNumber, token);
  }

  // แสดงข้อความสำเร็จ
  private async showSuccessAlert(phoneNumber: string, token: string) {
    const alert = await this.alertController.create({
      header: 'สำเร็จ',
      message: `ได้รับข้อมูล:<br>โทรศัพท์: ${phoneNumber}<br>Token: ${token.substring(0, 10)}...`,
      buttons: ['ตกลง']
    });

    await alert.present();
  }

  // ฟังก์ชันทางเลือก: Dialog แบบ Advanced พร้อม real-time validation
  async showAdvancedDialog() {
    let currentPhoneNumber = '';
    let currentToken = '';

    const alert = await this.alertController.create({
      header: 'ป้อนข้อมูล',
      message: this.getValidationMessage('', ''),
      inputs: [
        {
          name: 'phoneNumber',
          type: 'tel',
          placeholder: 'หมายเลขโทรศัพท์ (9-10 หลัก)',
          attributes: {
            maxlength: 10
          },
          handler: (input) => {
            currentPhoneNumber = input.value || '';
            // อัพเดทข้อความ validation แบบ real-time
            const messageEl = document.querySelector('ion-alert .alert-message');
            if (messageEl) {
              messageEl.innerHTML = this.getValidationMessage(currentPhoneNumber, currentToken);
            }
          }
        },
        {
          name: 'token',
          type: 'text',
          placeholder: 'Token (30 ตัวอักษร)',
          attributes: {
            maxlength: 30
          },
          handler: (input) => {
            currentToken = input.value || '';
            // อัพเดทข้อความ validation แบบ real-time
            const messageEl = document.querySelector('ion-alert .alert-message');
            if (messageEl) {
              messageEl.innerHTML = this.getValidationMessage(currentPhoneNumber, currentToken);
            }
          }
        }
      ],
      buttons: [
        {
          text: 'ยกเลิก',
          role: 'cancel'
        },
        {
          text: 'ยืนยัน',
          handler: (data) => {
            const validation = this.validateInputs(data.phoneNumber, data.token);
            if (validation.isValid) {
              this.handleValidData(data.phoneNumber, data.token);
              return true;
            } else {
              this.showErrorAlert(validation.errors);
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // สร้างข้อความ validation แบบ real-time
  private getValidationMessage(phoneNumber: string, token: string): string {
    let message = 'กรุณากรอกข้อมูลให้ครบถ้วน<br><br>';

    // Phone validation message
    if (phoneNumber) {
      if (/^[0-9]{9,10}$/.test(phoneNumber)) {
        message += '✅ หมายเลขโทรศัพท์: ถูกต้อง<br>';
      } else {
        message += '❌ หมายเลขโทรศัพท์: ต้องเป็นตัวเลข 9-10 หลัก<br>';
      }
    } else {
      message += '⚪ หมายเลขโทรศัพท์: ยังไม่ได้กรอก<br>';
    }

    // Token validation message
    if (token) {
      if (token.length === 30) {
        message += '✅ Token: ถูกต้อง (30 ตัวอักษร)<br>';
      } else {
        message += `❌ Token: ${token.length}/30 ตัวอักษร<br>`;
      }
    } else {
      message += '⚪ Token: ยังไม่ได้กรอก<br>';
    }

    return message;
  }
}
