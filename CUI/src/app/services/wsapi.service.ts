import { Injectable } from '@angular/core';
import { setWsHeartbeat } from 'ws-heartbeat/client';
import { EMACHINE_COMMAND, IAlive, IBillProcess, IClientId, IReqModel, IResModel, IVendingMachineBill, IVendingMachineSale } from './syste.model';
import * as cryptojs from 'crypto-js';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { EventEmitter } from 'events';
import { AppcachingserviceService } from './appcachingservice.service';
import { IENMessage } from '../models/base.model';
import { IndexerrorService } from '../indexerror.service';
@Injectable({
  providedIn: 'root'
})
export class WsapiService {
  // vsales: IVendingMachineSale[];


  wsurl = 'ws://localhost:9009';
  webSocket: WebSocket;
  retries = 1;
  machineId: string;
  otp: string;

  eventEmmiter = new EventEmitter();

  public balanceUpdateSubscription = new BehaviorSubject<number>(0);
  public loginSubscription = new BehaviorSubject<IClientId>(null);
  public aliveSubscription = new BehaviorSubject<IAlive>(null);
  public billProcessSubscription = new BehaviorSubject<IBillProcess>(null);
  public waitingDelivery = new BehaviorSubject<IBillProcess>(null);

  public refreshSubscription = new BehaviorSubject<boolean>(false);

  retry: any;
  // vsales=new Array<IVendingMachineSale>();
  constructor(
    private cashingService: AppcachingserviceService,
    public IndexedLogDB: IndexerrorService,

  ) {
  }
  onBillProcess(cb: (data: any) => void) {
    if (cb) {
      this.eventEmmiter.on('billProcess', cb);
    }
  }
  int = null;
  connect(url: string, machineId: string, otp: string) {
    console.log(`connnn`, machineId, url);
    this.wsurl = url;
    this.webSocket = new WebSocket(this.wsurl);

    clearInterval(this.retries);
    this.retry = null;

    // setWsHeartbeat(this.webSocket, '{"command":"ping"}', { pingInterval: 10000, pingTimeout: 15000 });
    if (this.int) {
      clearInterval(this.int);
      this.int = null;
    }
    this.int = setInterval(async () => {
      if (this.webSocket.readyState !== 1) {
        console.log('websocket not ready');
        return;
      }
      console.log('ping1');
      const allLogs = await this.IndexedLogDB.getAllErrorData();
      console.log('allLogs', allLogs);
      this.send({
        command: EMACHINE_COMMAND.ping, data: {
          errorLog: allLogs,
        }, ip: '', message: '', status: -1, time: new Date().toString(), token: cryptojs.SHA256(machineId + otp).toString(cryptojs.enc.Hex)
      });
    }, 10000);
    this.webSocket.onopen = (ev) => {
      this.retries = 0;
      console.log('connection has been opened', ev);
      // this.pingTimeout = setTimeout(() => {
      //   this.webSocket.close();
      // }, 30000 + 1000);
      this.machineId = machineId;
      this.otp = otp;

      this.send({ command: EMACHINE_COMMAND.login, data: '', ip: '', message: '', status: -1, time: new Date().toString(), token: cryptojs.SHA256(machineId + otp).toString(cryptojs.enc.Hex) });

      this.webSocket.onclose = (ev): void => {
        // this.timerId = setInterval(() => {
        //   this.connect();
        // }, 10000);
        console.log('connection has been closed', ev);

        setTimeout(() => {
          // clearInterval(this.retries);
          // this.retry = null;
          this.connect(url, machineId, otp);

        }, 5000);
      };
    };
    this.webSocket.onerror = (ev) => {
      console.log('ERROR', ev);
      // this.retry = setInterval(() => {
      setTimeout(() => {

        // clearInterval(this.retries);
        // this.retry = null;
        this.connect(url, machineId, otp);

      }, 5000);

      // }, 5000)
    }
    this.webSocket.onmessage = async (ev) => {
      try {
        const res = JSON.parse(ev.data) as IResModel;
        if (res) {

          const data = res.data;
          // console.log('COMMING DATA', res);
          switch (res.command) {
            case 'ping':

              // control version



              console.log('Ping');
              // { command: "ping", production: this.production, balance: r,limiter,merchant,mymmachinebalance, mymlimiterbalance, setting ,mstatus,mymstatus,mymsetting,mymlimiter},
              // this.setting_allowCashIn = data.setting.allowCashIn;
              // this.setting_allowVending = data.setting.allowVending;
              this.aliveSubscription.next({ test: data?.test, data, balance: Number(data.balance) } as IAlive);
              break;
            case 'confirm':
              data.transactionID = res.transactionID;
              console.log('confirm', data);
              // this.billProcessSubscription.next(data);
              this.eventEmmiter.emit('billProcess', data);
              break;

            case 'waitingt':
              console.log('Start waiting');
              this.waitingDelivery.next(data)
              break;

            case 'login':
              if (data.data)
                console.log('LOGIN', data);

              this.loginSubscription.next(data.data)
              break;

            case 'CREDIT_NOTE':
              console.log(`credit note la der`);
              this.balanceUpdateSubscription.next(data);

              break;
            case 'refresh':
              console.log(`en`);
              this.refreshSubscription.next(data);
              break;

            case 'resetCashing':
              await this.resetCashing();
              break;

            // query today bill
            // query all bills
            // query today refill
            // query all refill
            default:
              break;
          }
        }
      } catch (error) {
        console.log('WS MESSAGE', error);

      }

    }
  }
  send(data: IReqModel | IResModel) {
    const that = this;
    console.log('sending');

    this.waitForSocketConnection(function () {
      console.log('connection is ready to send', data);
      that.webSocket.send(JSON.stringify(data));
    });
  }


  waitForSocketConnection(callback) {
    const socket = this.webSocket;
    const that = this;
    console.log('waiting for sending');

    setTimeout(
      function () {
        console.log('wating count', socket.readyState, new Date().getTime());

        // console.log('ws ready state', socket.readyState);
        if (socket.readyState === 1) {
          console.log("Connection is made")
          if (callback) {
            callback();
            that.retries = 0;
          }
        } else {
          if (that.retries > 2) {
            console.log('create a new connection');

            // that.webSocket.close();
            that.connect(that.wsurl, that.machineId, that.otp);
            that.retries = 0;
          } else {
            console.log("waiting for the connection...")
            that.waitForSocketConnection(callback);
          }
          that.retries++;
        }
      }, 1000); // wait 5 milisecond for the connection...
  }

  resetCashing(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const ownerUuid = localStorage.getItem('machineId');
        if (ownerUuid) {
          console.log(`reset cashing...`);
          await this.cashingService.remove(ownerUuid);
          // window.location.reload();
        }

        resolve(IENMessage.success);
      } catch (error) {

        resolve(error.message);
      }
    });
  }
}
