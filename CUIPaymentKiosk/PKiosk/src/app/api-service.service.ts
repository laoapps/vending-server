import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IAlive, IBankNote, IBillBankNote, IBillCashIn, IClientId, IMachineId, IMMoneyRequestRes, IResModel } from './syste.model';
import { WsapiServiceService } from './wsapi-service.service';
import * as moment from 'moment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LoadingController, ModalController, ToastController } from '@ionic/angular';
import * as cryptojs from 'crypto-js'
import { BehaviorSubject } from 'rxjs';
import { AdsPage } from './ads/ads.page';
@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {
  test={test:false};

  wsurl = environment.wsurl;
  url = environment.url;
  machineId = {} as IMachineId;
  clientId = {} as IClientId;
  wsAlive = {} as IAlive;
  // machine = {bankNotes: [], badBN: []} as { bankNotes: Array<IBankNote>, badBN: Array<IBankNote>};
  billCashIn = Array<IBillCashIn>();
  timer = { t: 30 };
  t: any;
  pn='';
  sumBN={value:0};
  mMoneyRequestor = {} as IMMoneyRequestRes;

  accountInfoSubcription = new BehaviorSubject<any>(null);
  constructor(public wsapi: WsapiServiceService,
    public http: HttpClient,
    public toast: ToastController,
    public modal: ModalController,
    public loading:LoadingController) {

    // this.zone.runOutsideAngular(() => {
    this.machineId.machineId = '88888888';
    this.machineId.otp = '111111';
    this.wsapi.aliveSubscription.subscribe(r => {
      if (!r) return console.log('empty');
      console.log('ws alive subscription', r);
      this.wsAlive.time = new Date();
      this.wsAlive.isAlive = this.checkOnlineStatus();
      this.test.test=r?.test
    });
    setInterval(()=>{
      if(!this.billCashIn.length){
        this.modal.getTop().then(r=>{
          if(!r){
            if(!this.billCashIn.length)
            this.showModal(AdsPage).then(v=>{
              v.present();
            })
          }
        })
      }else{
        this.closeModal();
      }
    },1000)
    this.wsapi.refreshSubscription.subscribe(r => {
      if (r) {
        // setTimeout(() => {
          window.location.reload();
        // }, 3000);
      }

    })
    this.wsapi.startCounterSubscription.subscribe(v => {
      console.log('startCounterSubscription', v);
      if (v) {
       this.setCounter(v.t);
       this.closeModal();
      }

    })
    this.wsapi.statusSubscription.subscribe(v => {
      console.log('statusSubscription', v);
      if (v) {
       toast.create({message:v,duration:5000}).then(r=>{
        r.present();

       })
      }
    })
    this.wsapi.stopSubscription.subscribe(v => {
      console.log('stopSubscription', v);
      if (v) {        
        window.location.reload();
       
      }
    })
    this.wsapi.setCounterSubscription.subscribe(v => {
      console.log('setCounterSubscription', v);
      if (v) {
       this.setCounter(v.t);
      //  if(v.t==0){
      //   window.location.reload();
      //  }
      }
    })
    this.wsapi.loginSubscription.subscribe(v => {
      console.log('loginSubscription', v);
      if (v) {
        this.clientId = v;
        if (v.billCashIn) {
          // this.billCashin.badBankNotes.length=0;
          const x = v.billCashIn;
          console.log('x', x);
          this.billCashIn.push(x);
        
           this.setCounter(30);
        }
      }

    })
    this.wsapi.billBankCashInSubscription.subscribe(v => {
      console.log('billBankCashInSubscription', v);

      if (v) {
        this.billCashIn[0].bankNotes.length=0;
        this.billCashIn[0].bankNotes.push(...v.bankNotes);
        this.sumBN.value=0;
        this.billCashIn[0].bankNotes.forEach(v=>{
          this.sumBN.value+= v.value;
        })
        console.log('bank notes', this.billCashIn);
        // this.validateMMoney(v.requestor.transData[0].accountRef);

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
  setCounter(t:number) {
    if (this.t) {
      clearInterval(this.t);
      this.t = null;
      this.timer.t = t;
    }
    this.t = setInterval(() => {
      if (this.timer.t == 0) {
        clearInterval(this.t);
        this.t = null;
        this.timer.t = t;
        this.closeWS();
        return this.billCashIn.length=0; //==> for app

        /// for WEB
        // setTimeout(() => {
        //   window.location.reload();
        // }, 2000);

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
    this.closeWS();
    // delay refreshing 15 seconds
    this.loading.create().then(r=>{
      r.present();
    })
    setTimeout(() => {
      window.location.reload();
    }, 15000);
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
