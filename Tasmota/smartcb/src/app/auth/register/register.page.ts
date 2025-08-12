import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { CaptchaServiceService } from 'src/app/services/captchaService/captcha-service.service';
import { LoadingService } from 'src/app/services/loading.service';
import { ConfirmcodePage } from '../confirmcode/confirmcode.page';
import { AuthServiceService } from 'src/app/services/authService/auth-service.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {
  phonenumber: string = '';
  password: string = '';
  confirmPassword: string = '';
  isOwner: boolean = false;
  isUser: boolean = false;
  captchaId: string = '';
  captchaInput:any
  captchaImage: string = '';
  message: string = '';
  public intervalId: any;



  constructor(
    public alertCtrl:AlertController,
    public m: LoadingService,
    public captcha:CaptchaServiceService,
    private modalCtrl: ModalController,
    public auths:AuthServiceService
  ) {
    this.startCountdown();
   }

   startCountdown() {
    this.intervalId = setInterval(() => {
      this.onClick_refresh();
    }, 5 * 60 * 1000);
  }

  stopCountdown(){
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnInit() {
    this.fetchCaptcha();
  }

  async fetchCaptcha() {
    try {
      const { id, image } = await this.captcha.getCaptcha();
      console.log(id);
      console.log(image);
      
      this.captchaId = id;
      this.captchaImage = image;
    } catch (error) {
      console.error('Error fetching CAPTCHA:', error);
      this.message = 'Failed to fetch CAPTCHA.';
    }
  }

  onClick_refresh(){
    this.captchaInput= ''
    this.captchaId = "";
    this.captchaImage = "";
    this.fetchCaptcha();
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  onClick_BackToLogin() {
    this.m.closeModal({dismiss: false});
  }

  async onClick_Register() {
    if (!this.phonenumber || !this.password || !this.confirmPassword) {
      this.showAlert('Error', 'Please fill in all fields');
      return;
    }

    if (this.phonenumber.length !== 8 || !/^\d+$/.test(this.phonenumber)) {
      this.showAlert('Error', 'Phone number must be 8 digits');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.showAlert('Error', 'Passwords do not match');
      return;
    }

    if (this.password != this.confirmPassword) {
      this.showAlert('Error','password not the same!!')
      return;
    }
    this.CaptchaAndSendOtp()

  }

  async CaptchaAndSendOtp() {
    try {
      if (!this.captchaId || !this.captchaInput || !this.phonenumber) {
        this.showAlert('Error','somthing wrong!!')
        return;
      }
      const response = await this.captcha.validateCaptchaAndSendOtp(this.captchaId,this.captchaInput,this.phonenumber);
      console.log('====================================');
      console.log('res',response);
      console.log('====================================');
      if (response.message == "Invalid_CAPTCHA") {
        this.showAlert('Error','Reptcha is not correct!!')
      }else if (response?.status == 1) {
        const code = await this.open_modal_comfrim("+85620" + this.phonenumber,response?.data.otp)
          if (code.data.code) {
            this.register(code.data.code)
          }
      }else{
        this.showAlert('Error','somthing wrong!!')
      }
    } catch (error) {
      console.error('Error validating CAPTCHA:', error);
      this.showAlert('Error','somthing wrong!!')
    }
  }

  async open_modal_comfrim(phonenumber: string,otp:any): Promise<any> {
    const modal = await this.modalCtrl.create({
      component: ConfirmcodePage,
      cssClass: 'my-custom-class',
      componentProps: {
        'phonenumber': phonenumber,
        'otp': otp,
      }
    });
    await modal.present();

    return new Promise((resolve, reject) => {
      modal.onWillDismiss().then(res => {
        resolve(res)
      }).catch(err => {
        reject(err)
      })
    });
  }


  async register(otp) {//register ລົງທະບຽນ
    // async register() {//register ລົງທະບຽນ
      const data = {
        name:"+85620" + this.phonenumber,
        phoneNumber:"+85620" + this.phonenumber,
        username:"+85620" + this.phonenumber,
        password: this.password,
        googleToken: {phoneNumber: "+85620" + this.phonenumber,otp}
      }

      // this.showAlert('','ກະລຸນາລໍຖ້າ...')
  
      this.auths.register(data).subscribe(async res =>{
        console.log(res);
        if (res.status == 1) {
          console.log('register success!!!!!!!!!!!!!', res);
          // this.load.onAlertAccess('ການລົງທະບຽນສຳເລັດແລ້ວ');
          this.showAlert('Alert','Register success!!');
          this.m.closeModal({dismiss: true});
          this.stopCountdown();
        } else {
          console.log('cant register', res);
          // this.alert('ການລົງທະບຽນບໍ່ສຳເລັດ');
          if(res.data.message=='username : +85620' + this.phonenumber + '  already exists!'){
            // this.load.onAlertAccess('ເບີໂທນີ້ເຄີຍລົງທະບຽນແລ້ວ');
            this.showAlert_close('Alert','Already register');
          }else{       
            this.showAlert('Error','Register fail!!')
          }
        }
      }, async error => {
        console.log('errror', error);
        this.showAlert('Error','somthing wrong!!')
      })
    }



  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
  async showAlert_close(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [{
        text:'ok',
        handler:() =>{
          this.m.closeModal({dismiss:false})
        }
      }],
    });
    await alert.present();
  }

}
