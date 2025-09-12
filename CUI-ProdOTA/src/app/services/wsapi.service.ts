import { Injectable, OnDestroy } from '@angular/core';
import { setWsHeartbeat } from 'ws-heartbeat/client';
import { EMACHINE_COMMAND, EMessage, IAlive, IBillProcess, IClientId, IReqModel, IResModel } from './syste.model';
import * as cryptojs from 'crypto-js';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { EventEmitter } from 'events';
import { AppcachingserviceService } from './appcachingservice.service';
import { IENMessage } from '../models/base.model';
import { IndexerrorService } from '../indexerror.service';
import { environment } from 'src/environments/environment.prod';
import { App } from '@capacitor/app';

@Injectable({
  providedIn: 'root'
})
export class WsapiService implements OnDestroy {
  private wsurl = 'ws://localhost:9009';
  private webSocket: WebSocket | null = null;
  private machineId: string;
  private otp: string;
  retries = 1;

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 60000;
  private pingInterval: any = null;
  private connectionTimeout: any = null;
  private failureStartTime: number | null = null;
  private maxFailureDuration = 300000;

  private eventEmitter = new EventEmitter(); // Fixed typo
  public connectionStatus = new BehaviorSubject<string>('disconnected');
  public balanceUpdateSubscription = new BehaviorSubject<number>(0);
  public loginSubscription = new BehaviorSubject<IClientId>(null);
  public aliveSubscription = new BehaviorSubject<IAlive>(null);
  public billProcessSubscription = new BehaviorSubject<IBillProcess>(null);
  public waitingDelivery = new BehaviorSubject<IBillProcess>(null);
  public refreshSubscription = new BehaviorSubject<boolean>(false);
  public wsalertSubscription = new BehaviorSubject<any>(null);

  retry: any;
  constructor(
    private cashingService: AppcachingserviceService,
    private IndexedLogDB: IndexerrorService,
  ) { }

  ngOnDestroy(): void {
    this.disconnect();
  }

  int = null;
  connect(url: string, machineId: string, otp: string): void {
    this.wsurl = url;
    this.machineId = machineId;
    this.otp = otp;
    this.disconnect();

    this.connectionStatus.next('connecting');
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
      console.log('ping');
      const allLogs = await this.IndexedLogDB.getAllErrorData();
      // const settingVersion = localStorage.getItem('settingVersion') ?? 'NO';

      this.send({
        command: EMACHINE_COMMAND.ping, data: {
          settingVersion: `${new Date().getTime()}`,
          errorLog: allLogs,
          clientVersion: environment.versionId || '0.0.0'
        }, ip: '', message: '', status: -1, time: new Date().toString(), token: cryptojs.SHA256(machineId + otp).toString(cryptojs.enc.Hex)
      });
    }, 10000);

    // setWsHeartbeat(this.webSocket, JSON.stringify({ command: EMACHINE_COMMAND.ping }), {
    //   pingInterval: 10000,
    //   pingTimeout: 15000
    // });

    this.connectionTimeout = setTimeout(() => {
      if (this.webSocket?.readyState !== WebSocket.OPEN) {
        console.log('Connection timed out');
        this.webSocket?.close();
        this.IndexedLogDB.addBillProcess({ errorData: 'Connection timed out' })
      }
    }, 30000);

    this.webSocket.onopen = () => {
      console.log('WebSocket connection opened');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.failureStartTime = null;
      this.connectionStatus.next('connected');
      clearTimeout(this.connectionTimeout);

      this.send({
        command: EMACHINE_COMMAND.login,
        data: '',
        ip: '',
        message: '',
        status: -1,
        time: new Date().toString(),
        token: cryptojs.SHA256(machineId + otp).toString(cryptojs.enc.Hex),
      });
    };

    this.webSocket.onclose = (ev) => {
      console.log('WebSocket closed', ev);
      this.IndexedLogDB.addBillProcess({ errorData: 'WebSocket closed' })
      this.connectionStatus.next('disconnected');
      this.scheduleReconnect();
    };

    this.webSocket.onerror = (ev) => {
      console.error('WebSocket error', ev);
      this.IndexedLogDB.addBillProcess({ errorData: `WebSocket error ${JSON.stringify(ev)}` })
      this.connectionStatus.next('disconnected');
      this.webSocket?.close();
    };

    this.webSocket.onmessage = async (ev) => {
      try {
        const res = JSON.parse(ev.data) as IResModel;
        if (res) {
          console.log('Received message', res);
          switch (res.command) {
            case 'ping':
              console.log('Ping received');
              this.aliveSubscription.next({
                test: res.data?.test,
                data: res.data,
                balance: Number(res.data?.balance ?? '0'),
                message: res.message === EMessage.openstock ? EMessage.openstock : undefined,
              } as IAlive);
              break;
            case 'wsalert':
              console.log('wsalert', res.data);
              this.wsalertSubscription.next(res?.data);
              const t = this.eventEmitter.emit('wsalert', res?.data);
              console.log('t', t);
              break;
            case 'confirm':
              res.data.transactionID = res.transactionID;
              this.eventEmitter.emit('billProcess', res.data);
              this.billProcessSubscription.next(res.data);
              break;
            case 'waitingt':
              this.waitingDelivery.next(res.data);
              break;
            case 'login':
              this.loginSubscription.next(res.data.data);
              break;
            case 'CREDIT_NOTE':
              this.balanceUpdateSubscription.next(res.data);
              break;
            case 'refresh':
              this.refreshSubscription.next(res.data);
              break;
            case 'resetCashing':
              await this.resetCashing();
              break;
            case 'setMenus':
              for (const element of res.data?.menu ?? []) {
                this.setMenu(element?.menu, element.status);
              }
              break;
            default:
              break;
          }
        }
      } catch (error) {
        console.error('WebSocket message error', error);
      }
    };
  }

  private scheduleReconnect(): void {
    if (!this.failureStartTime) {
      this.failureStartTime = Date.now();
    }

    const elapsedTime = Date.now() - this.failureStartTime;
    if (elapsedTime >= this.maxFailureDuration) {
      console.error('Connection failed for 5 minutes, exiting app');
      try {
        App.exitApp();
      } catch (error) {
        console.error('Failed to exit app', error);
      }
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.wsurl, this.machineId, this.otp);
    }, delay);
  }

  disconnect(): void {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    this.connectionStatus.next('disconnected');
  }

  send(data: IReqModel | IResModel): void {
    if (this.webSocket?.readyState === WebSocket.OPEN) {
      console.log('Sending data', data);
      this.webSocket.send(JSON.stringify(data));
    } else {
      console.log('WebSocket not ready, queuing send');
      this.waitForSocketConnection(() => {
        if (this.webSocket?.readyState === WebSocket.OPEN) {
          this.webSocket.send(JSON.stringify(data));
        } else {
          console.error('Failed to send data, WebSocket not open');
        }
      });
    }
  }

  private waitForSocketConnection(callback: () => void): void {
    if (this.webSocket?.readyState === WebSocket.OPEN) {
      callback();
      return;
    }

    const maxWaitAttempts = 5;
    let waitAttempts = 0;

    const waitInterval = setInterval(() => {
      if (this.webSocket?.readyState === WebSocket.OPEN) {
        clearInterval(waitInterval);
        callback();
      } else if (waitAttempts >= maxWaitAttempts) {
        clearInterval(waitInterval);
        console.error('Wait for WebSocket connection timed out');
        this.scheduleReconnect();
      }
      waitAttempts++;
    }, 1000);
  }

  setMenu(m: string, status: boolean): void {
    localStorage.setItem('menu-' + m, status ? 'true' : 'false');
  }

  resetCashing(): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      try {
        const ownerUuid = localStorage.getItem('machineId');
        if (ownerUuid) {
          console.log('Resetting cashing...');
          await this.cashingService.remove(ownerUuid);
        }
        resolve(IENMessage.success);
      } catch (error) {
        console.error('Reset cashing error', error);
        resolve(error.message);
      }
    });
  }

  onBillProcess(cb: (data: any) => void): void {
    if (cb) {
      this.eventEmitter.on('billProcess', cb);
    }
  }

  onWsAlert(cb: (data: any) => void): { unsubscribe: () => void } {
    if (cb) {
      console.log('Registering wsalert listener', cb);
      this.eventEmitter.on('wsalert', cb);
      return {
        unsubscribe: () => {
          console.log('Unregistering wsalert listener', cb);
          this.eventEmitter.removeListener('wsalert', cb);
        },
      };
    }
    return { unsubscribe: () => { } };
  }
}