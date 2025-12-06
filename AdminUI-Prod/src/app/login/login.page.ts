import { Component, OnInit, } from '@angular/core';
import { ApiService } from '../services/api.service';
import { LaabApiService } from '../services/laab-api.service';
import { LoginProcess } from './processes/login.process';
import { IENMessage } from '../models/base.model';
import { LAAB_Login } from '../models/laab.model';
import { VendingAPIService } from '../services/vending-api.service';
import { PhoneTokenDialogComponent } from '../phone-token-dialog/phone-token-dialog.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  private loginProcess: LoginProcess;

  phonenumber: string;
  password: string;

  adminAuthentication: boolean = true;
  subadminAuthenticaition: boolean = false;
  superadminAuthentication: boolean = false;

  constructor(
    private apiService: ApiService,
    private laabAPIService: LaabApiService,
    private vendingAPIService: VendingAPIService
  ) {
    this.loginProcess = new LoginProcess(this.apiService, this.vendingAPIService);
  }

  ngOnInit() {
  }
  go() {
    window.location.href = '/tabs';
  }

  login(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        const params: LAAB_Login = {
          phonenumber: '+85620' + this.phonenumber,
          password: this.password
        }
        const run = await this.loginProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);


        // this.apiService.router.navigate(['/template']);
        // this.apiService.router.navigate(['/tabs/tab1']);
        const result = await this.apiService.presentPhoneSecretDialog();
        if (result) {
          localStorage.setItem('lva_ownerUuid', run.data[0].owneruuid);
          localStorage.setItem('lva_name', run.data[0].name);
          localStorage.setItem('lva_token', run.data[0].token);
          if (result.secret) {
            localStorage.setItem('secretLocal', result.secret);
          }
          localStorage.setItem('phoneNumberLocal', result.phoneNumber);
          localStorage.setItem('secretLocal', result.secret);
          this.apiService.router.navigate(['/tabs/onlinemachines']);
          // if(this.apiService.logPlatformInfo() === 'ios'|| this.apiService.logPlatformInfo() === 'android'){
          //   localStorage.setItem('secretLocal', result.secret);
          //   this.apiService.router.navigate(['/tabs/onlinemachines']);
          // }else{
          //   this.apiService.router.navigate(['/tabs/tab1']);
          // }
          resolve(IENMessage.success);
        }
        console.log('-----> result', result);

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }


}
