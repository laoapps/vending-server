import { Injectable } from '@angular/core';
import { setWsHeartbeat } from 'ws-heartbeat/client';
import { IReqModel, IResModel } from './syste.model';
@Injectable({
  providedIn: 'root'
})
export class WsapiService {
  wsurl = 'ws://localhost:9009';
  webSocket = new WebSocket(this.wsurl);
  retries =1;
  constructor() { 

    
  }
  connect(){
    setWsHeartbeat(this.webSocket, '{"kind":"ping"}', { pingInterval: 10000, pingTimeout: 30000 });
    this.webSocket.onopen = (ev) => {
      this.retries = 0;
      console.log('connection has been opened', ev);
      // this.pingTimeout = setTimeout(() => {
      //   this.webSocket.close();
      // }, 30000 + 1000);



      this.webSocket.onclose = (ev): void => {
        // this.timerId = setInterval(() => {
        //   this.connect();
        // }, 10000);
        console.log('connection has been closed', ev);

      };
    };
    this.webSocket.onmessage = (ev) => {
      const res = JSON.parse(ev.data) as IResModel;
      if (res) {

        const data = res.data;
        console.log('COMMING DATA', res);
        switch (res.command) {
          case 'ping':
            
            break;
            case 'confirm':
            
              break;
        
          default:
            break;
        }
      }
    }
  }
  send(data: IReqModel | IResModel) {
    const that = this;
    this.waitForSocketConnection(function () {
      that.webSocket.send(JSON.stringify(data));
    });
  }


  waitForSocketConnection(callback) {
    const socket = this.webSocket;
    const that = this;
    setTimeout(
      function () {
        // console.log('ws ready state', socket.readyState);
        if (socket.readyState === 1) {
          // console.log("Connection is made")
          if (callback != null) {
            callback();
            that.retries = 0;
          }
        } else {
          if (that.retries > 2) {
            console.log('create a new connection');

            // that.webSocket.close();
            that.connect();
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
