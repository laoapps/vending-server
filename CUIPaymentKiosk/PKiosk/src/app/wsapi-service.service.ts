import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { EMACHINE_COMMAND, IAlive, IBillBankNote, IClientId, IResModel } from './syste.model';
import { setWsHeartbeat } from 'ws-heartbeat/client';
import * as cryptojs from 'crypto-js';
@Injectable({
  providedIn: 'root'
})
export class WsapiServiceService {

  wsurl = 'ws://localhost:8888';
  webSocket: WebSocket;
  retries = 1;
  machineId=''
  otp = '';
  token = '';
  transID=-1;

  public loginSubscription = new BehaviorSubject<IClientId>(null);
  public aliveSubscription = new BehaviorSubject<IAlive>(null);
  public billBankNoteSubscription = new BehaviorSubject<IBillBankNote>(null);


  public refreshSubscription = new BehaviorSubject<boolean>(false);
  retry: any;
  constructor() {
  }
  closeWS(){
    this.webSocket.close();

  }
  connect(url: string,transID:number, machineId: string, otp: string) {
    this.transID=transID;
    this.wsurl = url;
    this.machineId = machineId;
    this.otp = otp;
    this.webSocket = new WebSocket(this.wsurl);

    clearInterval(this.retries);
    this.retry = null;
    setWsHeartbeat(this.webSocket, '{"command":"ping"}', { pingInterval: 10000, pingTimeout: 15000 });

    clearInterval(this.retries);
    this.retry = null;
    this.webSocket.onopen = (ev) => {
      this.retries = 0;
      console.log('connection has been opened', ev);

      this.webSocket.onclose = (ev): void => {
        console.log('connection has been closed', ev);
        // setTimeout(() => {
        //   this.connect(url, machineId, otp);

        // }, 5000);
      };
    };
    this.webSocket.onerror = (ev) => {
      console.log('ERROR', ev);
        // setTimeout(() => {
        //   this.connect(url, machineId, otp);

        // }, 5000);
    }
    this.webSocket.onmessage = (ev) => {
      // this.dataSubscription.next(JSON.parse(ev.data));

      const res = JSON.parse(ev.data) as IResModel;
      if (res) {

        const data = res.data;
        console.log('COMMING DATA', res);
        switch (res.command) {
          case 'ping':
            console.log('Ping');
            this.aliveSubscription.next({} as IAlive)
            break;
          case 'confirm':
            console.log('confirm', data);
            this.billBankNoteSubscription.next(data)
            break;
          case 'login':
            if (data.data)
              this.loginSubscription.next(data.data)
            break;
          case 'refresh':
            this.refreshSubscription.next(data.data);
            break;
          default:
            break;
        }
      }
    
    }
    this.send({ command: EMACHINE_COMMAND.login, data: {transID}, ip: '', message: '', status: -1, time: new Date().toString(), token: cryptojs.SHA256(machineId + otp).toString(cryptojs.enc.Hex) });

    
  }
  send(data) {
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
            that.connect(that.wsurl,that.transID, that.machineId, that.otp);
            that.retries = 0;
          } else {
            console.log("waiting for the connection...")
            that.waitForSocketConnection(callback);
          }
          that.retries++;
        }
      }, 1000); // wait 5 milisecond for the connection...
  }
}
