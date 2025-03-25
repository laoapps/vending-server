import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { LaabApiService } from '../services/laab-api.service';
import { LoginProcess } from './processes/login.process';
import { IENMessage } from '../models/base.model';
import { LAAB_Login } from '../models/laab.model';
import { VendingAPIService } from '../services/vending-api.service';

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
  go(){
    window.location.href='/tabs';
  }

  login(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const params: LAAB_Login = {
          phonenumber: '+85620' + this.phonenumber,
          password: this.password
        }
        const run = await this.loginProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        
        localStorage.setItem('lva_ownerUuid', run.data[0].owneruuid);
        localStorage.setItem('lva_name', run.data[0].name);
        localStorage.setItem('lva_token', run.data[0].token);
        // this.apiService.router.navigate(['/template']);
        this.apiService.router.navigate(['/tabs/tab1']);
        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  

}
