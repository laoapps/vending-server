import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IAlive, IBankNote, IBillBankNote, IBillCashIn, IClientId, IMachineId, IMMoneyRequestRes, IResModel } from './syste.model';
import { WsapiServiceService } from './wsapi-service.service';
import * as moment from 'moment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ModalController, ToastController } from '@ionic/angular';
import * as cryptojs from 'crypto-js'
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {
  wsurl = environment.wsurl;
  url = environment.url;
  machineId = {} as IMachineId;
  clientId = {} as IClientId;
  wsAlive = {} as IAlive;
  // machine = {bankNotes: [], badBN: []} as { bankNotes: Array<IBankNote>, badBN: Array<IBankNote>};
  billCashIn = Array<IBillCashIn>();
  timer = { t: 30 };
  t: any;

  mMoneyRequestor = {} as IMMoneyRequestRes;

  accountInfoSubcription = new BehaviorSubject<any>(null);
  constructor(public wsapi: WsapiServiceService,
    public http: HttpClient,
    public toast: ToastController,
    public modal: ModalController) {

    // this.zone.runOutsideAngular(() => {
    this.machineId.machineId = '12345678';
    this.machineId.otp = '111111';
    this.wsapi.aliveSubscription.subscribe(r => {
      if (!r) return console.log('empty');
      console.log('ws alive subscription', r);
      this.wsAlive.time = new Date();
      this.wsAlive.isAlive = this.checkOnlineStatus();

    });
    this.wsapi.refreshSubscription.subscribe(r => {
      if (r) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }

    })
    this.wsapi.loginSubscription.subscribe(v => {
      console.log('v', v);
      if (v) {
        this.clientId = v;
        if (v.billCashIn) {
          // this.billCashin.badBankNotes.length=0;
          const x = v.billCashIn;
          console.log('x', x);
          this.billCashIn.push(x);
          this.closeModal();
          this.setCounter();
        }
      }

    })
    this.wsapi.billBankCashInSubscription.subscribe(v => {
      console.log('v', v);

      if (v) {
        // this.billCashin.badBankNotes.length=0;
        Object.keys(v).forEach(k => {
          this.billCashIn[k] = v[k];
        })
        this.validateMMoney(v.requestor.transData[0].accountRef);

      }
    })


  }
  connectWS() {
    const transID = this.mMoneyRequestor.transID;
    this.wsapi.connect(this.wsurl, transID, this.machineId.machineId, this.machineId.otp);
  }
  closeWS() {
    this.wsapi.closeWS();
  }
  setCounter() {
    if (this.t) {
      clearInterval(this.t);
      this.t = null;
      this.timer.t = 30;
    }
    this.t = setInterval(() => {
      if (this.timer.t == 0) {
        clearInterval(this.t);
        this.t = null;
        this.timer.t = 30;
        setTimeout(() => {
          window.location.reload();
        }, 3000);

      }

      this.timer.t--;
    }, 1000);
  }

  showModal(component: any) {
    return this.modal.create({ component, cssClass: 'full-modal' });
  }
  closeModal() {
    this.modal.getTop().then(v => v ? v.dismiss() : null)
  }
  public checkOnlineStatus() {
    if (this.wsAlive) {
      return (moment().get('milliseconds') - moment(this.wsAlive.time).get('milliseconds')) < 10 * 1000;
    } else {
      return false;
    }
  }
  refresh() {
    this.wsapi.send('');
  }
  loadBankNotes() {
    return this.http.get<IResModel>(this.url + '/loadBankNotes');
  }
  validateMMoney(n: string) {
    const token = cryptojs.SHA256(this.machineId.machineId + this.machineId.otp).toString(cryptojs.enc.Hex);
    return this.http.post<IResModel>(this.url + '/validateMmoneyCashIn', {
      token,
      n
    });
  }
}
