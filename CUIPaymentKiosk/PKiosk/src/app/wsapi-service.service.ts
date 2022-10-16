import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class WsapiServiceService {

  wsurl = 'ws://localhost:8888';
  webSocket: WebSocket;
  retries = 1;
  machineId: string;
  otp: string;
  public dataSubscription = new BehaviorSubject<any>(null);


  retry: any;
  constructor() {
  }
  connect() {
    this.webSocket = new WebSocket(this.wsurl);

    clearInterval(this.retries);
    this.retry = null;
    this.webSocket.onopen = (ev) => {
      this.retries = 0;
      console.log('connection has been opened', ev);

      this.webSocket.onclose = (ev): void => {
        console.log('connection has been closed', ev);
        setTimeout(() => {
          this.connect();

        }, 5000);
      };
    };
    this.webSocket.onerror = (ev) => {
      console.log('ERROR', ev);
        setTimeout(() => {
          this.connect();

        }, 5000);
    }
    this.webSocket.onmessage = (ev) => {
      this.dataSubscription.next(JSON.parse(ev.data));
    }
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
