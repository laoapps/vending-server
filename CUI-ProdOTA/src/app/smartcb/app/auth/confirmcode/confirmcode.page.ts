import { Component, Input, OnInit } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-confirmcode',
  templateUrl: './confirmcode.page.html',
  styleUrls: ['./confirmcode.page.scss'],
  standalone: false
})
export class ConfirmcodePage implements OnInit {
  public duration = 30;
  public intervalId: any;
  OTP: any = {
    first: '',
    second: '',
    third: '',
    forth: '',
    fifth: '',
    sixth: ''
  };

  public Code:string;
  @Input() phonenumber: number;
  @Input() otp: any;


  constructor(private modalCtrl:ModalController,
    private alt:AlertController,
  ) {

   }

  ngOnInit() {
    this.startCountdown();
    if (this.otp) {
      this.OTP.first = this.otp[0];
      this.OTP.second = this.otp[1];
      this.OTP.third = this.otp[2];
      this.OTP.forth = this.otp[3];
      this.OTP.fifth = this.otp[4];
      this.OTP.sixth = this.otp[5];
      setTimeout(()=>{
        this.dismiss();
      },2000)
    }
  }

  startCountdown() {
    this.intervalId = setInterval(() => {
        if (this.duration > 0) {
            this.duration--;
        } else {
            this.stopCountdown();
        }
    }, 1000);
}

  stopCountdown() {
      if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
      }
  }

  async otpController(event, next, prev, index) {
    // your existing code
  
    if (index == 1) {
      this.OTP.first = event.target.value;
    } else if (index == 2) {
      this.OTP.second = event.target.value;
    } else if (index == 3) {
      this.OTP.third = event.target.value;
    } else if (index == 4) {
      this.OTP.forth = event.target.value;
    } else if (index == 5) {
      this.OTP.fifth = event.target.value;
    } else if (index == 6) {
      this.OTP.sixth = event.target.value;
    }
  
    if (index == 6 && this.OTP.first && this.OTP.second && this.OTP.third && this.OTP.forth && this.OTP.fifth && this.OTP.sixth) {
      console.log("submit", this.OTP);
      this.Code = (this.OTP.first + this.OTP.second + this.OTP.third + this.OTP.forth + this.OTP.fifth + this.OTP.sixth).trim();
  
      this.dismiss();
    }
  
    if (event.target.value.length < 1 && prev) {
      prev.setFocus();
    } else if (next && event.target.value.length > 0) {
      next.setFocus();
    } else {
      return 0;
    }
  
    return 0;  // explicit return undefined to satisfy all code paths
  }
  

  async button_sendOTP(){
    if(this.OTP.first && this.OTP.second && this.OTP.third && this.OTP.forth && this.OTP.fifth && this.OTP.sixth){
      
      this.Code=(this.OTP.first + this.OTP.second + this.OTP.third + this.OTP.forth + this.OTP.fifth + this.OTP.sixth).trim();

      this.dismiss();
    }else{
      // this.load.onAlertWarning('ກະລຸນາໃສ່ລະຫັດໃຫ້ຄົບ');
      const alert = await this.alt.create({
        header: 'Error',
        message: 'Login fail please check phonenumber and password',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }
  }

  dismiss() {
    if(this.Code){
      this.modalCtrl.dismiss({
        'code': this.Code
      });
    }else{
      this.modalCtrl.dismiss({
        'code': this.otp
      });
    }
  }

  backToSignUp() {

    this.modalCtrl.dismiss({
      'dismiss': true
    });
    
  }

}
